import React, { useEffect, useMemo, useRef, useState } from 'react';
import { ITerminalOptions, Terminal } from 'xterm';
import { FitAddon } from 'xterm-addon-fit';
import { SearchAddon } from 'xterm-addon-search';
import { SearchBarAddon } from 'xterm-addon-search-bar';
import { WebLinksAddon } from 'xterm-addon-web-links';
import { Unicode11Addon } from 'xterm-addon-unicode11';
import { ScrollDownHelperAddon } from '@/plugins/XtermScrollDownHelperAddon';
import SpinnerOverlay from '@/components/elements/SpinnerOverlay';
import { ServerContext } from '@/state/server';
import { usePermissions } from '@/plugins/usePermissions';
import { theme as th } from 'twin.macro';
import useEventListener from '@/plugins/useEventListener';
import { debounce } from 'debounce';
import { usePersistedState } from '@/plugins/usePersistedState';
import { SocketEvent, SocketRequest } from '@/components/server/events';
import classNames from 'classnames';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTerminal, faCode, faQuestionCircle, faAngleDoubleRight, faExternalLinkAlt, faPlus, faTrashAlt } from '@fortawesome/free-solid-svg-icons';
import { useTranslation } from 'react-i18next';
import http from '@/api/http';
import ShortcutModal from '@/components/server/console/ShortcutModal';

import 'xterm/css/xterm.css';
import styles from './style.module.css';

const theme = {
    background: th`colors.black`.toString(),
    cursor: 'transparent',
    black: th`colors.black`.toString(),
    red: '#E54B4B',
    green: '#9ECE58',
    yellow: '#FAED70',
    blue: '#396FE2',
    magenta: '#BB80B3',
    cyan: '#2DDAFD',
    white: '#d0d0d0',
    brightBlack: 'rgba(255, 255, 255, 0.2)',
    brightRed: '#FF5370',
    brightGreen: '#C3E88D',
    brightYellow: '#FFCB6B',
    brightBlue: '#82AAFF',
    brightMagenta: '#C792EA',
    brightCyan: '#89DDFF',
    brightWhite: '#ffffff',
    selection: '#FAF089',
};

const terminalProps: ITerminalOptions = {
    disableStdin: true,
    cursorStyle: 'underline',
    allowTransparency: true,
    fontSize: 12,
    fontFamily: th('fontFamily.mono'),
    rows: 30,
    theme: theme,
    convertEol: true,
};

export default () => {
    const { t } = useTranslation('frontend');
    const TERMINAL_PRELUDE = '\u001b[1m\u001b[33mcontainer@pterodactyl~ \u001b[0m';
    const ref = useRef<HTMLDivElement>(null);
    const terminal = useMemo(() => new Terminal({ ...terminalProps }), []);
    const fitAddon = new FitAddon();
    const searchAddon = new SearchAddon();
    const searchBar = new SearchBarAddon({ searchAddon });
    const webLinksAddon = new WebLinksAddon();
    const unicode11Addon = new Unicode11Addon();
    const scrollDownHelperAddon = new ScrollDownHelperAddon();
    const { connected, instance } = ServerContext.useStoreState((state) => state.socket);
    const [canSendCommands] = usePermissions(['control.console']);
    const serverId = ServerContext.useStoreState((state) => state.server.data?.id);
    const serverUuid = ServerContext.useStoreState((state) => state.server.data?.uuid);
    const isTransferring = ServerContext.useStoreState((state) => state.server.data?.isTransferring || false);
    const [history, setHistory] = usePersistedState<string[]>(`${serverId}:command_history`, []);
    const [historyIndex, setHistoryIndex] = useState(-1);
    const [shortcuts, setShortcuts] = useState<any[]>([]);
    const [isShortcutModalVisible, setIsShortcutModalVisible] = useState(false);
    // SearchBarAddon has hardcoded z-index: 999 :(
    const zIndex = `
    .xterm-search-bar__addon {
        z-index: 10;
    }`;

    const handleConsoleOutput = (line: string, prelude = false) => {
        if (prelude) {
            terminal.write('\r\n' + TERMINAL_PRELUDE + line.replace(/(?:\r\n|\r|\n)$/im, '') + '\u001b[0m\r\n');
        } else {
            // Check if the line ends with a newline character, if not, append \r\n
            const output = line.endsWith('\n') ? line.replace(/\n$/, '\r\n') : (line.endsWith('\r') ? line : line + '\r\n');
            terminal.write(output);
        }
    };

    const handleTransferStatus = (status: string) => {
        switch (status) {
            // Sent by either the source or target node if a failure occurs.
            case 'failure':
                terminal.write('\r' + TERMINAL_PRELUDE + t('server.console.transfer_failed', 'Transfer has failed.') + '\u001b[0m\r\n');
                return;
        }
    };

    const handleDaemonErrorOutput = (line: string) =>
        terminal.write(
            '\r\n' + TERMINAL_PRELUDE + '\u001b[1m\u001b[41m' + line.replace(/(?:\r\n|\r|\n)$/i, '') + '\u001b[0m\r\n'
        );

    const handlePowerChangeEvent = (state: string) =>
        terminal.write('\r\n' + TERMINAL_PRELUDE + t('server.console.server_status', 'Server marked as {{status}}...', { status: state }) + '\u001b[0m\r\n');

    const handleCommandKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'ArrowUp') {
            const newIndex = Math.min(historyIndex + 1, history!.length - 1);

            setHistoryIndex(newIndex);
            e.currentTarget.value = history![newIndex] || '';

            // By default up arrow will also bring the cursor to the start of the line,
            // so we'll preventDefault to keep it at the end.
            e.preventDefault();
        }

        if (e.key === 'ArrowDown') {
            const newIndex = Math.max(historyIndex - 1, -1);

            setHistoryIndex(newIndex);
            e.currentTarget.value = history![newIndex] || '';
        }

        const command = e.currentTarget.value;
        if (e.key === 'Enter' && command.length > 0) {
            setHistory((prevHistory) => [command, ...prevHistory!].slice(0, 32));
            setHistoryIndex(-1);

            instance && instance.send('send command', command);
            e.currentTarget.value = '';
        }
    };

    useEffect(() => {
        if (serverUuid) {
            http.get(`/api/client/servers/${serverUuid}/shortcuts`)
                .then(({ data }) => setShortcuts(data))
                .catch(error => console.error('Failed to fetch shortcuts:', error));
        }
    }, [serverUuid]);

    const saveShortcuts = (newShortcuts: any[]) => {
        if (!serverUuid) return;
        setShortcuts(newShortcuts);
        http.post(`/api/client/servers/${serverUuid}/shortcuts`, { shortcuts: newShortcuts })
            .catch(error => console.error('Failed to save shortcuts:', error));
    };

    const addShortcut = (label: string, command: string) => {
        const newShortcuts = [...shortcuts, { id: Math.random().toString(36).substring(2, 9), label, command }];
        saveShortcuts(newShortcuts);
        setIsShortcutModalVisible(false);
    };

    const deleteShortcut = (id: string) => {
        const newShortcuts = shortcuts.filter(s => s.id !== id);
        saveShortcuts(newShortcuts);
    };

    useEffect(() => {
        if (connected && ref.current && !terminal.element) {
            terminal.loadAddon(fitAddon);
            terminal.loadAddon(searchAddon);
            terminal.loadAddon(searchBar);
            terminal.loadAddon(webLinksAddon);
            terminal.loadAddon(unicode11Addon);
            terminal.loadAddon(scrollDownHelperAddon);

            terminal.open(ref.current);

            // Activate Unicode 11 for proper emoji and special character width handling
            terminal.unicode.activeVersion = '11';

            setTimeout(() => {
                if (terminal.element) {
                    try {
                        fitAddon.fit();
                    } catch (e) {
                        console.warn('fitAddon.fit() failed:', e);
                    }
                }
            }, 100);
            searchBar.addNewStyle(zIndex);

            // Add support for capturing keys
            terminal.attachCustomKeyEventHandler((e: KeyboardEvent) => {
                if ((e.ctrlKey || e.metaKey) && e.key === 'c') {
                    document.execCommand('copy');
                    return false;
                } else if ((e.ctrlKey || e.metaKey) && e.key === 'f') {
                    e.preventDefault();
                    searchBar.show();
                    return false;
                } else if (e.key === 'Escape') {
                    searchBar.hidden();
                }
                return true;
            });
        }
    }, [terminal, connected]);

    useEventListener(
        'resize',
        debounce(() => {
            if (terminal.element) {
                try {
                    fitAddon.fit();
                } catch (e) {
                    console.warn('fitAddon.fit() failed on resize:', e);
                }
            }
        }, 100)
    );

    useEffect(() => {
        const listeners: Record<string, (s: string) => void> = {
            [SocketEvent.STATUS]: handlePowerChangeEvent,
            [SocketEvent.CONSOLE_OUTPUT]: handleConsoleOutput,
            [SocketEvent.INSTALL_OUTPUT]: handleConsoleOutput,
            [SocketEvent.TRANSFER_LOGS]: handleConsoleOutput,
            [SocketEvent.TRANSFER_STATUS]: handleTransferStatus,
            [SocketEvent.DAEMON_MESSAGE]: (line) => handleConsoleOutput(line, true),
            [SocketEvent.DAEMON_ERROR]: handleDaemonErrorOutput,
        };

        if (connected && instance) {
            // Do not clear the console if the server is being transferred.
            if (!isTransferring) {
                terminal.clear();
            }

            Object.keys(listeners).forEach((key: string) => {
                instance.addListener(key, listeners[key]);
            });
            instance.send(SocketRequest.SEND_LOGS);
        }

        return () => {
            if (instance) {
                Object.keys(listeners).forEach((key: string) => {
                    instance.removeListener(key, listeners[key]);
                });
            }
        };
    }, [connected, instance]);

    return (
        <div className={classNames(styles.terminal, 'relative')}>
            <SpinnerOverlay visible={!connected} size={'large'} />
            <div
                className={classNames(styles.container, styles.overflows_container, { 'rounded-b': !canSendCommands })}
            >
                <div className={'h-full'}>
                    <div id={'terminal-container'} ref={ref} />
                </div>
            </div>
            {canSendCommands && (
                <div className={'relative'}>
                    <div className={styles.shortcut_container}>
                        {shortcuts.map((s) => (
                            <button
                                key={s.id}
                                onClick={() => instance?.send('send command', s.command)}
                                onContextMenu={(e) => {
                                    e.preventDefault();
                                    if (confirm(`${t('server.console.shortcuts.delete')} "${s.label}"?`)) {
                                        deleteShortcut(s.id);
                                    }
                                }}
                                title={s.label}
                                className={'flex items-center group'}
                            >
                                <FontAwesomeIcon icon={faTerminal} className={'mr-1.5 flex-shrink-0 opacity-70'} />
                                <span className={'truncate inline-block'}>{s.label}</span>
                                <span
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        deleteShortcut(s.id);
                                    }}
                                    className={'ml-2 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity text-red-500'}
                                    title={t('server.console.shortcuts.delete')}
                                >
                                    <FontAwesomeIcon icon={faTrashAlt} />
                                </span>
                            </button>
                        ))}
                        <button onClick={() => setIsShortcutModalVisible(true)} className={'bg-indigo-600! hover:bg-indigo-500!'}>
                            <FontAwesomeIcon icon={faPlus} className={'mr-1.5'} />
                            {t('server.console.shortcuts.add')}
                        </button>
                        <button onClick={() => window.open(`${window.location.pathname}/console-popout`, '_blank', 'width=900,height=600')}>
                            <FontAwesomeIcon icon={faExternalLinkAlt} className={'mr-1.5 opacity-70'} />
                            Popout
                        </button>
                    </div>
                    <ShortcutModal
                        visible={isShortcutModalVisible}
                        onDismissed={() => setIsShortcutModalVisible(false)}
                        onSave={addShortcut}
                    />
                    <div className={classNames('relative', styles.overflows_container)}>
                        <input
                            className={classNames('peer', styles.command_input, 'text-neutral-200 placeholder-neutral-500 font-medium')}
                            type={'text'}
                            placeholder={t('server.console.type_command', 'Type a command...')}
                            aria-label={t('server.console.command_input_aria', 'Console command input.')}
                            disabled={!instance || !connected}
                            onKeyDown={handleCommandKeyDown}
                            autoCorrect={'off'}
                            autoCapitalize={'none'}
                        />
                        <div
                            className={classNames(
                                'text-neutral-500 peer-focus:text-neutral-100 peer-focus:animate-pulse',
                                styles.command_icon
                            )}
                        >
                            <FontAwesomeIcon icon={faAngleDoubleRight} className={'w-4 h-4'} />
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
