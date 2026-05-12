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
    const status = ServerContext.useStoreState((state) => state.status.value);
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
    const [currentProgress, setCurrentProgress] = useState<string | null>(null);
    const [isMinimized, setIsMinimized] = useState(true);
    const [isHiddenByUser, setIsHiddenByUser] = useState(false);
    const [position, setPosition] = useState({ x: 20, y: 20 });
    const [isDragging, setIsDragging] = useState(false);
    const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });

    const lastStepRef = useRef<string | null>(null);
    const stepProgressRef = useRef<number>(0);
    const progressTimerRef = useRef<NodeJS.Timeout | null>(null);

    const handleMouseDown = (e: React.MouseEvent) => {
        setIsDragging(true);
        setDragOffset({
            x: e.clientX - (window.innerWidth - position.x),
            y: e.clientY - position.y
        });
    };

    useEffect(() => {
        const handleMouseMove = (e: MouseEvent) => {
            if (!isDragging) return;
            const newX = window.innerWidth - (e.clientX - dragOffset.x);
            const newY = e.clientY - dragOffset.y;
            setPosition({ x: Math.max(10, newX), y: Math.max(10, newY) });
        };
        const handleMouseUp = () => setIsDragging(false);

        if (isDragging) {
            window.addEventListener('mousemove', handleMouseMove);
            window.addEventListener('mouseup', handleMouseUp);
        }
        return () => {
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('mouseup', handleMouseUp);
        };
    }, [isDragging, dragOffset]);

    // 狀態同步：當伺服器狀態變動時更新提示，且不自動關閉
    useEffect(() => {
        if (status === 'running') {
            setCurrentProgress(t('dashboard.server_row.running', 'Running'));
            setIsHiddenByUser(false);
        } else if (status === 'offline') {
            setCurrentProgress(t('dashboard.server_row.offline', 'Offline'));
            // 注意：這裡不強制重置 isHiddenByUser，尊重用戶在運行期間的關閉選擇
        }
    }, [status]);

    const handleConsoleOutput = (line: string, prelude = false) => {
        // 清理 ANSI 代碼以進行純文字分析
        const cleanLine = line.replace(/\u001b\[[0-9;]*[a-zA-Z]/g, '').trim();
        
        // 智能關鍵字偵測：包含動作詞與狀態詞
        const progressKeywords = [
            'Downloading', 'Extracting', 'Pulling', 'Pushing', 'Installing', 
            'Verifying', 'Loading', 'Checksum', 'Waiting', 'Cleanup'
        ];
        
        // 判斷是否為伺服器內部日誌 (例如 Minecraft 的 [09:14:28] INFO...)
        const isServerLog = /^\[\d{2}:\d{2}:\d{2}\]/.test(cleanLine);
        
        // 判斷是否為進度型行：必須是關鍵字開頭，且長度合理
        // 智能過濾：如果伺服器已在運行中，單純的關鍵字通常是用戶輸入，而非進度
        const isProgressStep = !isServerLog && progressKeywords.some(kw => {
            const isExactMatch = cleanLine === kw;
            if (isExactMatch && status === 'running') return false;

            return (isExactMatch || cleanLine.startsWith(kw + ':') || cleanLine.startsWith(kw + ' ') || cleanLine.startsWith(kw + '...')) 
                && cleanLine.length < 60;
        });
        
        // 優化進度條判斷：排除包含字母數字的時間戳記 [12:34:56]，只匹配包含進度符號的方括號
        const hasOriginalBar = !isServerLog && /\[[=#>\-\s]{5,}\]/.test(line);
        
        // 優化完成判定：同樣在運行中排除單純的關鍵字回顯
        const isCompletion = !isServerLog && (
            (cleanLine.includes('complete') && (status !== 'running' || cleanLine.length > 10)) || 
            cleanLine.includes('Success') || 
            cleanLine.includes('finished')
        );
        
        // 判斷是否為指令回顯 (Echo Filtering)：避免用戶手動輸入關鍵字誤觸 UI
        const isEcho = line.includes('container@pterodactyl~');

        // 更新 Overlay 進度狀態 (用於視覺化 UI)
        // 排除指令回顯、伺服器日誌與 Daemon 前綴訊息
        if (!isEcho && !isServerLog && !prelude && (isProgressStep || (hasOriginalBar && cleanLine.length < 100))) {
            if (cleanLine.length > 3) {
                // 將關鍵字翻譯為本地語言
                let displayStatus = cleanLine;
                progressKeywords.forEach(kw => {
                    if (cleanLine.startsWith(kw)) {
                        displayStatus = cleanLine.replace(kw, t(`console.steps.${kw.toLowerCase().replace(' ', '_')}`, kw));
                    }
                });

                // 如果是完成狀態，強制設定進度為 100%
                if (isCompletion) {
                    setCurrentProgress(displayStatus + ' (100%)');
                } else {
                    setCurrentProgress(displayStatus);
                }

                if (progressTimerRef.current) clearTimeout(progressTimerRef.current);
                progressTimerRef.current = setTimeout(() => setCurrentProgress(null), 300000);
            }
        }

        if (prelude) {
            terminal.write('\r\n' + TERMINAL_PRELUDE + line.replace(/(?:\r\n|\r|\n)$/im, '') + '\u001b[0m\r\n');
            lastStepRef.current = null;
        } else {
            // --- 智能進度條聚合邏輯 ---
            // 排除指令回顯與伺服器日誌，確保手動輸入不會被改寫為進度條
            if (!isEcho && !isServerLog && isProgressStep && !hasOriginalBar && !isCompletion) {
                const activeStep = progressKeywords.find(kw => cleanLine.startsWith(kw)) || cleanLine;
                const translatedStep = t(`console.steps.${activeStep.toLowerCase().replace(' ', '_')}`, activeStep);
                
                if (lastStepRef.current === activeStep) {
                    stepProgressRef.current = Math.min(stepProgressRef.current + 1, 40);
                } else {
                    if (lastStepRef.current !== null) {
                        const barSize = 20;
                        const bar = '\u2588'.repeat(barSize);
                        const prevTranslated = t(`console.steps.${lastStepRef.current.toLowerCase().replace(' ', '_')}`, lastStepRef.current);
                        terminal.write(`\r \u001b[38;5;40m\u2714 ${prevTranslated}\u001b[0m [${bar}] \u001b[38;5;40m${t('console.status.download_complete', 'Done')}\u001b[0m \r\n`);
                    }
                    stepProgressRef.current = 1;
                    lastStepRef.current = activeStep;
                }

                const barSize = 20;
                const filledSize = Math.floor((stepProgressRef.current / 40) * barSize);
                const bar = '\u2588'.repeat(filledSize) + '\u2591'.repeat(barSize - filledSize);
                const spinner = ['\u25d0', '\u25d3', '\u25d1', '\u25d2'][stepProgressRef.current % 4];
                const processingText = t('console.processing', 'Processing');
                terminal.write(`\r \u001b[38;5;39m${spinner} ${translatedStep}\u001b[0m [${bar}] \u001b[38;5;244m${processingText}...\u001b[0m \r`);
                return;
            }

            // 完成狀態清理
            if (isCompletion || (cleanLine.length > 0 && !isProgressStep && !line.includes('\r'))) {
                if (lastStepRef.current) {
                    const barSize = 20;
                    const bar = '\u2588'.repeat(barSize);
                    const translatedStep = t(`console.steps.${lastStepRef.current.toLowerCase().replace(' ', '_')}`, lastStepRef.current);
                    terminal.write(`\r \u001b[38;5;40m\u2714 ${translatedStep}\u001b[0m [${bar}] \u001b[38;5;40m${t('console.status.download_complete', 'Done')}\u001b[0m \r\n`);
                    lastStepRef.current = null;
                }
            }

            // 處理特殊關鍵字高亮
            let output = line;
            if (cleanLine === 'Download complete') {
                output = `\r\u001b[1;32m${t('console.status.download_complete', 'Download complete')}\u001b[0m\r\n`;
            } else if (cleanLine === 'Pull complete') {
                output = `\r\u001b[1;32m${t('console.status.pull_complete', 'Pull complete')}\u001b[0m\r\n`;
            } else if (cleanLine === 'Verifying Checksum') {
                output = `\r\u001b[1;33m${t('console.steps.checksum', 'Verifying Checksum')}\u001b[0m\r\n`;
            }

            // --- 換行處理邏輯 ---
            let formatted = output.replace(/\r?\n/g, '\r\n');
            
            // 如果不是原地更新 (\r)，且行尾沒有換行，則強制補上
            if (!output.endsWith('\r') && !output.endsWith('\n') && !hasOriginalBar) {
                formatted += '\r\n';
            }

            terminal.write(formatted);
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
                .then(({ data }) => setShortcuts(Array.isArray(data) ? data : []))
                .catch(error => {
                    console.error('Failed to fetch shortcuts:', error);
                    setShortcuts([]);
                });
        }
    }, [serverUuid]);

    const saveShortcuts = (newShortcuts: any[]) => {
        if (!serverUuid) return;
        const safeShortcuts = Array.isArray(newShortcuts) ? newShortcuts : [];
        setShortcuts(safeShortcuts);
        http.post(`/api/client/servers/${serverUuid}/shortcuts`, { shortcuts: safeShortcuts })
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
                <div className={'h-full relative'}>
                    <div id={'terminal-container'} ref={ref} />
                    
                    {/* Floating Task Window - Always visible monitor until manually hidden */}
                    {!isHiddenByUser && (
                        <div 
                            className={classNames('absolute z-50 animate-in fade-in zoom-in-95 duration-500 select-none', {
                                'cursor-grabbing': isDragging,
                            })}
                            style={{ 
                                top: `${position.y}px`, 
                                right: `${position.x}px`,
                                transition: isDragging ? 'none' : 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
                            }}
                        >
                            {isMinimized ? (
                                /* Minimized Bubble Mode */
                                <div className={'flex items-center gap-1'}>
                                    <div 
                                        onClick={() => setIsMinimized(false)}
                                        onMouseDown={handleMouseDown}
                                        className={'group flex items-center gap-3 bg-black/80 backdrop-blur-xl border border-white/20 p-2 rounded-full shadow-2xl cursor-grab hover:scale-110 active:scale-95 transition-all'}
                                    >
                                        <div className={classNames('w-3 h-3 rounded-full animate-pulse', {
                                            'bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)]': status === 'running',
                                            'bg-yellow-500 shadow-[0_0_8px_rgba(234,179,8,0.6)]': status === 'starting' || status === 'installing',
                                            'bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.6)]': status === 'stopping' || status === 'offline' || status === 'suspended',
                                            'bg-gray-500': !status,
                                        })}></div>
                                        <span className={'text-[10px] font-mono text-white/70 group-hover:text-white transition-colors pr-2'}>
                                            {status ? t(`dashboard.server_row.${status}`, t(`console.${status}`, status.toUpperCase())) : t('console.active')}
                                        </span>
                                    </div>
                                    <button 
                                        onClick={() => setIsHiddenByUser(true)}
                                        className={'p-2 bg-black/60 backdrop-blur-xl border border-white/10 rounded-full text-white/30 hover:text-red-400 hover:bg-red-500/20 transition-all shadow-xl'}
                                    >
                                        <svg className={'w-3 h-3'} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
                                    </button>
                                </div>
                            ) : (
                                /* Full Window Mode */
                                <div className={'w-72 bg-black/60 backdrop-blur-2xl border border-white/10 rounded-2xl shadow-[0_0_40px_rgba(0,0,0,0.5)] overflow-hidden relative group'}>
                                    {/* Draggable Header */}
                                    <div 
                                        onMouseDown={handleMouseDown}
                                        className={'flex items-center justify-between p-3 bg-white/5 border-b border-white/5 cursor-grab active:cursor-grabbing'}
                                    >
                                        <div className={'flex items-center gap-2'}>
                                            <div className={classNames('w-2 h-2 rounded-full', {
                                                'bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.4)]': status === 'running',
                                                'bg-yellow-500 shadow-[0_0_8px_rgba(234,179,8,0.4)]': status === 'starting' || status === 'installing',
                                                'bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.4)]': status === 'stopping' || status === 'offline' || status === 'suspended',
                                                'bg-gray-500': !status,
                                            })}></div>
                                            <span className={'text-[10px] font-bold uppercase tracking-[0.1em] text-white/50'}>
                                                {t('console.system_process')}
                                            </span>
                                        </div>
                                        <div className={'flex items-center gap-1.5'}>
                                            <button 
                                                onClick={() => setIsMinimized(true)}
                                                className={'p-1 hover:bg-white/10 rounded transition-colors text-white/30 hover:text-white'}
                                                title={t('common.minimize', 'Minimize')}
                                            >
                                                <svg className={'w-3 h-3'} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 12H4" /></svg>
                                            </button>
                                            <button 
                                                onClick={() => setIsHiddenByUser(true)}
                                                className={'p-1 hover:bg-red-500/20 rounded transition-colors text-white/30 hover:text-red-400'}
                                                title={t('common.close', 'Close')}
                                            >
                                                <svg className={'w-3 h-3'} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
                                            </button>
                                        </div>
                                    </div>

                                    {/* Content Area */}
                                    <div className={'p-4'}>
                                        <div className={'flex items-center justify-between mb-3'}>
                                            <span className={classNames('text-[9px] font-mono px-1.5 py-0.5 rounded border transition-colors', {
                                                'bg-green-500/10 text-green-300 border-green-500/20': status === 'running',
                                                'bg-yellow-500/10 text-yellow-300 border-yellow-500/20': status === 'starting' || status === 'installing',
                                                'bg-red-500/10 text-red-300 border-red-500/20': status === 'stopping' || status === 'offline' || status === 'suspended',
                                                'bg-gray-500/10 text-gray-300 border-gray-500/20': !status,
                                            })}>
                                                {status ? t(`dashboard.server_row.${status}`, t(`console.${status}`, status.toUpperCase())) : t('console.active')}
                                            </span>
                                            <span className={'text-[8px] text-white/30 tracking-tighter'}>Better Pterodactyl</span>
                                        </div>
                                        <div className={'text-xs font-mono text-white/90 truncate mb-4 font-semibold'}>
                                            {currentProgress || (status ? t(`dashboard.server_row.${status}`, t(`console.${status}`, status.toUpperCase())) : t('console.active'))}
                                        </div>
                                        {status !== 'running' && status !== 'offline' && status !== 'suspended' && currentProgress && (
                                            <div className={'h-1.5 w-full bg-white/5 rounded-full overflow-hidden'}>
                                                <div 
                                                    className={'h-full bg-gradient-to-r from-blue-600 via-indigo-500 to-blue-400 rounded-full transition-all duration-500 relative'}
                                                    style={{ 
                                                        width: currentProgress.includes('100%') || currentProgress.includes('complete')
                                                            ? '100%'
                                                            : (currentProgress.includes('%') 
                                                                ? `${currentProgress.match(/(\d+)%/)?.[1] || 100}%` 
                                                                : (currentProgress.includes('[') ? `${Math.min((currentProgress.match(/[=#\u2588]/g)?.length || 0) * 2.5, 100)}%` : '100%'))
                                                    }}
                                                >
                                                    <div className={'absolute top-0 left-0 w-full h-full bg-white/20 animate-shimmer'} style={{ backgroundSize: '200% 100%', backgroundImage: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent)' }}></div>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
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
