import React, { useEffect, useState } from 'react';
import { Server } from '@/api/server/getServer';
import getServers from '@/api/getServers';
import ServerRow from '@/components/dashboard/ServerRow';
import Spinner from '@/components/elements/Spinner';
import PageContentBlock from '@/components/elements/PageContentBlock';
import useFlash from '@/plugins/useFlash';
import { useStoreState } from 'easy-peasy';
import { usePersistedState } from '@/plugins/usePersistedState';
import Switch from '@/components/elements/Switch';
import tw from 'twin.macro';
import useSWR from 'swr';
import { PaginatedResult } from '@/api/http';
import Pagination from '@/components/elements/Pagination';
import { useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useBatchPowerAction } from '@/api/server/useBatchPowerAction';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPlay, faRedo, faStop } from '@fortawesome/free-solid-svg-icons';
import getServerResourceUsage from '@/api/server/getServerResourceUsage';

export default function DashboardContainer() {
    const { t } = useTranslation();
    const { search } = useLocation();
    const { isBatching, runBatchAction, batchResults, currentAction: currentBatchAction } = useBatchPowerAction();
    const defaultPage = Number(new URLSearchParams(search).get('page') || '1');

    const [page, setPage] = useState(!isNaN(defaultPage) && defaultPage > 0 ? defaultPage : 1);
    const { clearFlashes, clearAndAddHttpError } = useFlash();
    const user = useStoreState((state) => state.user.data);
    const uuid = user?.uuid;
    const rootAdmin = user?.rootAdmin || false;
    const [showOnlyAdmin, setShowOnlyAdmin] = usePersistedState(`${uuid}:show_all_servers`, false);

    const { data: servers, error } = useSWR<PaginatedResult<Server>>(
        ['/api/client/servers', showOnlyAdmin && rootAdmin, page],
        () => getServers({ page, type: showOnlyAdmin && rootAdmin ? 'admin' : undefined })
    );

    const [isBatchMode, setIsBatchMode] = useState(false);
    const [selectedServers, setSelectedServers] = useState<string[]>([]);

    const toggleServerSelection = (id: string) => {
        setSelectedServers((prev: string[]) =>
            prev.includes(id) ? prev.filter((s: string) => s !== id) : [...prev, id]
        );
    };



    useEffect(() => {
        setPage(1);
    }, [showOnlyAdmin]);

    useEffect(() => {
        if (!servers) return;
        if (servers.pagination.currentPage > 1 && !servers.items.length) {
            setPage(1);
        }
    }, [servers?.pagination.currentPage]);

    useEffect(() => {
        // Don't use react-router to handle changing this part of the URL, otherwise it
        // triggers a needless re-render. We just want to track this in the URL incase the
        // user refreshes the page.
        window.history.replaceState(null, document.title, `/${page <= 1 ? '' : `?page=${page}`}`);
    }, [page]);

    useEffect(() => {
        if (error) clearAndAddHttpError({ key: 'dashboard', error });
        if (!error) clearFlashes('dashboard');
    }, [error]);

    return (
        <PageContentBlock title={t('dashboard.header', 'Dashboard')} showFlashKey={'dashboard'}>
            <div css={tw`mb-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4`}>
                <div css={tw`flex items-center gap-2`}>
                    <button
                        onClick={() => {
                            setIsBatchMode(!isBatchMode);
                            setSelectedServers([]);
                        }}
                        css={tw`px-4 py-2 rounded-xl text-sm font-bold transition-all duration-200 border border-white/10`}
                        style={{
                            backgroundColor: isBatchMode ? 'rgba(var(--color-brand-600), 0.2)' : 'rgba(var(--bg-card), 0.5)',
                            color: isBatchMode ? 'rgb(var(--color-brand-500))' : 'rgb(var(--text-secondary))',
                        }}
                    >
                        {isBatchMode ? t('dashboard.exit_batch_mode', 'Exit Batch Mode') : t('dashboard.batch_mode', 'Batch Mode')}
                    </button>
                    {isBatchMode && servers && (
                        <button
                            onClick={() => setSelectedServers(selectedServers.length === servers.items.length ? [] : servers.items.map(s => s.id))}
                            css={tw`px-3 py-1.5 rounded-lg text-xs font-medium bg-white/5 border border-white/5 text-neutral-400 hover:text-white transition-colors`}
                        >
                            {selectedServers.length === servers.items.length ? t('dashboard.deselect_all', 'Deselect All') : t('dashboard.select_all', 'Select All')}
                        </button>
                    )}
                </div>

                {rootAdmin && (
                    <div css={tw`flex items-center`}>
                        <p css={tw`uppercase text-xs text-neutral-400 mr-2`}>
                            {showOnlyAdmin ? t('dashboard.showing_others_servers', 'Showing others\' servers') : t('dashboard.showing_your_servers', 'Showing your servers')}
                        </p>
                        <Switch
                            name={'show_all_servers'}
                            defaultChecked={showOnlyAdmin}
                            onChange={() => setShowOnlyAdmin((s) => !s)}
                        />
                    </div>
                )}
            </div>


            {!servers ? (
                <Spinner centered size={'large'} />
            ) : (
                <Pagination data={servers} onPageSelect={setPage}>
                    {({ items }) =>
                        items.length > 0 ? (
                            <div className="flex flex-col gap-4">
                                {items.map((server, index) => (
                                    <ServerRow
                                        key={server.uuid}
                                        server={server}
                                        isBatchMode={isBatchMode}
                                        isSelected={selectedServers.includes(server.id)}
                                        onSelect={() => toggleServerSelection(server.id)}
                                        isBatchProcessing={batchResults[server.id] === 'processing'}
                                        batchActionType={currentBatchAction}
                                    />
                                ))}

                                {isBatchMode && selectedServers.length > 0 && (
                                    <div css={tw`fixed bottom-8 left-1/2 transform -translate-x-1/2 z-50 animate-fade-in-up`}>
                                        <div className="bg-neutral-900/90 backdrop-blur-xl border border-white/10 px-6 py-4 rounded-2xl shadow-2xl flex items-center gap-6">
                                            <div className="flex flex-col">
                                                <span className="text-white font-bold text-sm">{selectedServers.length} {t('dashboard.servers_selected', 'Servers Selected')}</span>
                                                <span className="text-neutral-400 text-[10px] uppercase font-bold tracking-widest">{t('dashboard.batch_actions', 'Batch Actions')}</span>
                                            </div>

                                            <div className="w-px h-8 bg-white/10 mx-2"></div>

                                            <div className="flex items-center gap-3">
                                                <button
                                                    onClick={() => runBatchAction(selectedServers, 'start')}
                                                    disabled={isBatching}
                                                    className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-500 disabled:opacity-50 text-white rounded-xl text-xs font-bold transition-all"
                                                >
                                                    <FontAwesomeIcon icon={faPlay} /> {t('dashboard.start_all', 'Start')}
                                                </button>
                                                <button
                                                    onClick={() => runBatchAction(selectedServers, 'restart')}
                                                    disabled={isBatching}
                                                    className="flex items-center gap-2 px-4 py-2 bg-yellow-600 hover:bg-yellow-500 disabled:opacity-50 text-white rounded-xl text-xs font-bold transition-all"
                                                >
                                                    <FontAwesomeIcon icon={faRedo} /> {t('dashboard.restart_all', 'Restart')}
                                                </button>
                                                <button
                                                    onClick={() => runBatchAction(selectedServers, 'stop')}
                                                    disabled={isBatching}
                                                    className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-500 disabled:opacity-50 text-white rounded-xl text-xs font-bold transition-all"
                                                >
                                                    <FontAwesomeIcon icon={faStop} /> {t('dashboard.stop_all', 'Stop')}
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        ) : (
                            <p css={tw`text-center text-sm text-neutral-400`}>
                                {showOnlyAdmin
                                    ? t('dashboard.no_other_servers', 'There are no other servers to display.')
                                    : t('dashboard.no_servers', 'There are no servers associated with your account.')}
                            </p>
                        )
                    }
                </Pagination>
            )}
        </PageContentBlock>
    );
};
