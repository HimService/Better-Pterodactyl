import React, { memo } from 'react';
import { ServerContext } from '@/state/server';
import Can from '@/components/elements/Can';
import ServerContentBlock from '@/components/elements/ServerContentBlock';
import isEqual from 'react-fast-compare';
import Spinner from '@/components/elements/Spinner';
import Features from '@feature/Features';
import Console from '@/components/server/console/Console';
import StatGraphs from '@/components/server/console/StatGraphs';
import PowerButtons from '@/components/server/console/PowerButtons';
import ServerDetailsBlock from '@/components/server/console/ServerDetailsBlock';
import { Alert } from '@/components/elements/alert';
import classNames from 'classnames';
import { useTranslation } from 'react-i18next';

export type PowerAction = 'start' | 'stop' | 'restart' | 'kill';

const ServerConsoleContainer = () => {
    const { t } = useTranslation('frontend');
    const name = ServerContext.useStoreState((state) => state.server.data!.name);
    const description = ServerContext.useStoreState((state) => state.server.data!.description);
    const isInstalling = ServerContext.useStoreState((state) => state.server.isInstalling);
    const isTransferring = ServerContext.useStoreState((state) => state.server.data!.isTransferring);
    const eggFeatures = ServerContext.useStoreState((state) => state.server.data!.eggFeatures, isEqual);
    const isNodeUnderMaintenance = ServerContext.useStoreState((state) => state.server.data!.isNodeUnderMaintenance);
    const status = ServerContext.useStoreState((state) => state.status.value);

    return (
        <ServerContentBlock title={t('server.console.title', 'Console')}>
            {(isNodeUnderMaintenance || isInstalling || isTransferring) && (
                <Alert type={'warning'} className={'mb-4'}>
                    {isNodeUnderMaintenance
                        ? t('server.console.node_under_maintenance', 'The node of this server is currently under maintenance and all actions are unavailable.')
                        : isInstalling
                            ? t('server.console.running_installation', 'This server is currently running its installation process and most actions are unavailable.')
                            : t('server.console.transferring', 'This server is currently being transferred to another node and all actions are unavailable.')}
                </Alert>
            )}
            <div className={'grid grid-cols-4 gap-4 mb-4'}>
                <div className={'hidden sm:block sm:col-span-2 lg:col-span-3 pr-4'}>
                    <h1 className={'font-header font-medium text-2xl text-neutral-900 dark:text-gray-50 leading-relaxed'} style={{ display: '-webkit-box', WebkitLineClamp: 1, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                        {name}
                    </h1>
                    <p className={'text-sm text-neutral-600 dark:text-neutral-400'} style={{ display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{description}</p>
                </div>
                <div className={'col-span-4 sm:col-span-2 lg:col-span-1 self-end'}>
                    <Can action={['control.start', 'control.stop', 'control.restart']} matchAny>
                        <PowerButtons className={'flex sm:justify-end space-x-2'} />
                    </Can>
                </div>
            </div>
            <div className={'grid grid-cols-4 gap-4 sm:gap-6 mb-6'}>
                <div
                    className={classNames(
                        'flex col-span-4 lg:col-span-3 rounded-[1.25rem] p-1 bg-black/40 ring-1 backdrop-blur-md shadow-2xl transition-all duration-1000',
                        {
                            'shadow-[0_0_40px_rgba(16,185,129,0.15)] ring-emerald-500/40': status === 'running' && !description?.toLowerCase().includes('['),
                            'shadow-[0_0_40px_rgba(245,158,11,0.15)] ring-yellow-500/40': status === 'starting',
                            'shadow-[0_0_40px_rgba(239,68,68,0.15)] ring-red-500/40': status === 'stopping',
                            'ring-[var(--brand-main)]/40 shadow-[var(--brand-glow)]': !!description?.toLowerCase().includes('[')
                        }
                    )}
                    style={{
                        boxShadow: description?.toLowerCase().includes('[') ? '0 0 40px var(--brand-glow)' : undefined,
                        borderColor: description?.toLowerCase().includes('[') ? 'var(--brand-main)' : undefined
                    }}
                >
                    <div className="w-full h-full rounded-xl overflow-hidden bg-black/90 border border-transparent">
                        <Spinner.Suspense>
                            <Console />
                        </Spinner.Suspense>
                    </div>
                </div>
                <ServerDetailsBlock className={'col-span-4 lg:col-span-1 order-last lg:order-none'} />
            </div>
            <div className={'grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6'}>
                <Spinner.Suspense>
                    <StatGraphs />
                </Spinner.Suspense>
            </div>
            <Features enabled={eggFeatures} />
        </ServerContentBlock>
    );
};

export default memo(ServerConsoleContainer, isEqual);
