import React, { useEffect, useState } from 'react';
import { Button } from '@/components/elements/button/index';
import Can from '@/components/elements/Can';
import { ServerContext } from '@/state/server';
import { PowerAction } from '@/components/server/console/ServerConsoleContainer';
import { Dialog } from '@/components/elements/dialog';
import classNames from 'classnames';
import { useTranslation } from 'react-i18next';

interface PowerButtonProps {
    className?: string;
}

export default ({ className }: PowerButtonProps) => {
    const { t } = useTranslation('frontend');
    const [open, setOpen] = useState(false);
    const status = ServerContext.useStoreState((state) => state.status.value);
    const instance = ServerContext.useStoreState((state) => state.socket.instance);

    const killable = status === 'stopping';
    const onButtonClick = (
        action: PowerAction | 'kill-confirmed',
        e: React.MouseEvent<HTMLButtonElement, MouseEvent>
    ): void => {
        e.preventDefault();
        if (action === 'kill') {
            return setOpen(true);
        }

        if (instance) {
            setOpen(false);
            instance.send('set state', action === 'kill-confirmed' ? 'kill' : action);
        }
    };

    useEffect(() => {
        if (status === 'offline') {
            setOpen(false);
        }
    }, [status]);

    return (
        <div className={className}>
            <Dialog.Confirm
                open={open}
                hideCloseIcon
                onClose={() => setOpen(false)}
                title={t('server.console.stop_process', 'Forcibly Stop Process')}
                confirm={t('server.console.continue', 'Continue')}
                onConfirmed={onButtonClick.bind(this, 'kill-confirmed')}
            >
                {t('server.console.stop_warning', 'Forcibly stopping a server can lead to data corruption.')}
            </Dialog.Confirm>
            <Can action={'control.start'}>
                <div className="flex-1 w-full">
                    <button
                        className={classNames(
                            'w-full block px-4 py-3 rounded-xl font-bold tracking-wide transition-all duration-300 shadow-lg text-sm sm:text-base',
                            status === 'offline'
                                ? 'bg-emerald-500 hover:bg-emerald-400 text-white shadow-emerald-500/30 hover:shadow-emerald-500/50 hover:-translate-y-0.5 border border-emerald-400/50'
                                : 'bg-neutral-200 dark:bg-neutral-800 text-neutral-400 cursor-not-allowed opacity-50'
                        )}
                        disabled={status !== 'offline'}
                        onClick={onButtonClick.bind(this, 'start')}
                    >
                        {t('server.console.start', 'START')}
                    </button>
                </div>
            </Can>
            <Can action={'control.restart'}>
                <div className="flex-1 w-full">
                    <button
                        className={classNames(
                            'w-full block px-4 py-3 rounded-xl font-bold tracking-wide transition-all duration-300 shadow-lg text-sm sm:text-base',
                            !status
                                ? 'bg-neutral-200 dark:bg-neutral-800 text-neutral-400 cursor-not-allowed opacity-50'
                                : 'bg-indigo-500 hover:bg-indigo-400 text-white shadow-indigo-500/30 hover:shadow-indigo-500/50 hover:-translate-y-0.5 border border-indigo-400/50'
                        )}
                        disabled={!status}
                        onClick={onButtonClick.bind(this, 'restart')}
                    >
                        {t('server.console.restart', 'RESTART')}
                    </button>
                </div>
            </Can>
            <Can action={'control.stop'}>
                <div className="flex-1 w-full">
                    <button
                        className={classNames(
                            'w-full block px-4 py-3 rounded-xl font-bold tracking-wide transition-all duration-300 shadow-lg text-sm sm:text-base',
                            status === 'offline'
                                ? 'bg-neutral-200 dark:bg-neutral-800 text-neutral-400 cursor-not-allowed opacity-50'
                                : 'bg-red-500 hover:bg-red-400 text-white shadow-red-500/30 hover:shadow-red-500/50 hover:-translate-y-0.5 border border-red-400/50'
                        )}
                        disabled={status === 'offline'}
                        onClick={onButtonClick.bind(this, killable ? 'kill' : 'stop')}
                    >
                        {killable ? t('server.console.kill', 'KILL') : t('server.console.stop', 'STOP')}
                    </button>
                </div>
            </Can>
        </div >
    );
};
