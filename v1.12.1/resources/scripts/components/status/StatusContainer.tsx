import React, { useEffect, useState } from 'react';
import PageContentBlock from '@/components/elements/PageContentBlock';
import { useTranslation } from 'react-i18next';
import tw from 'twin.macro';
import styled from 'styled-components/macro';
import Spinner from '@/components/elements/Spinner';
import { bytesToString } from '@/lib/formatters';
import { ServerIcon, LocationMarkerIcon, CheckCircleIcon, ExclamationCircleIcon, ShieldCheckIcon, GlobeAltIcon } from '@heroicons/react/solid';
import axios from 'axios';

const Container = styled.div`
    ${tw`flex flex-col gap-6 max-w-5xl mx-auto w-full px-4 mb-20`};
`;

const StatusBanner = styled.div<{ $allOnline: boolean; $someMaintenance: boolean }>`
    ${tw`flex items-center gap-4 p-6 rounded-2xl border transition-all duration-500 mb-4`};
    ${props => props.$allOnline ? tw`bg-green-500/10 border-green-500/20 text-green-400` :
        props.$someMaintenance ? tw`bg-yellow-500/10 border-yellow-500/20 text-yellow-500` :
            tw`bg-red-500/10 border-red-500/20 text-red-500`};
    box-shadow: 0 8px 32px -8px ${props => props.$allOnline ? 'rgba(34, 197, 94, 0.2)' :
        props.$someMaintenance ? 'rgba(234, 179, 8, 0.2)' :
            'rgba(239, 68, 68, 0.2)'};
`;

const NodeCard = styled.div<{ $offline?: boolean }>`
    ${tw`relative bg-neutral-800/40 rounded-xl p-5 transition-all duration-300 border border-neutral-700/50 flex flex-col md:flex-row md:items-center gap-4`};
    backdrop-filter: blur(12px);

    &:hover {
        ${tw`bg-neutral-800/60 border-neutral-600`};
        transform: translateY(-2px);
        box-shadow: 0 12px 24px -10px rgba(0, 0, 0, 0.4);
    }
`;

const HeartbeatBar = styled.div`
    ${tw`flex gap-1 h-8 items-center flex-grow overflow-hidden`};
`;

const HeartbeatTick = styled.div<{ $status: 'up' | 'down' | 'maintenance' }>`
    ${tw`w-1.5 h-6 rounded-md transition-all duration-300 hover:h-8 cursor-pointer`};
    ${props => props.$status === 'up' ? tw`bg-green-400` :
        props.$status === 'maintenance' ? tw`bg-yellow-400` :
            tw`bg-red-400`};
    opacity: 0.8;
    &:hover { opacity: 1; }
`;

const StatusText = styled.span<{ $status: 'up' | 'down' | 'maintenance' }>`
    ${tw`flex items-center gap-1.5 font-bold text-sm tracking-wide`};
    ${props => props.$status === 'up' ? tw`text-green-400` :
        props.$status === 'maintenance' ? tw`text-yellow-400` :
            tw`text-red-400`};
`;

const LanguageSelectorCard = styled.div`
    ${tw`fixed bottom-6 left-6 flex items-center gap-2 p-2 bg-neutral-900/60 border border-neutral-700/50 rounded-xl transition-all duration-300 z-50`};
    backdrop-filter: blur(16px);
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4);

    &:hover {
        ${tw`bg-neutral-900/80 border-neutral-600`};
    }

    select {
        ${tw`bg-transparent text-neutral-300 text-xs font-bold outline-none cursor-pointer pr-1`};
        appearance: none;
        &::-ms-expand { display: none; }
    }
`;

interface NodeStatus {
    id: number;
    name: string;
    location: string;
    status: 'up' | 'down' | 'maintenance';
    memory: number;
    disk: number;
}

const languages = [
    { code: 'zh-TW', name: '繁體中文' },
    { code: 'en', name: 'English' },
    { code: 'ja', name: '日本語' },
];

export default () => {
    const { t, i18n } = useTranslation();
    const [nodes, setNodes] = useState<NodeStatus[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchStatus = () => {
        axios.get('/api/public/status')
            .then(({ data }: { data: NodeStatus[] }) => setNodes(data))
            .catch(console.error)
            .finally(() => {
                setLoading(false);
            });
    };

    useEffect(() => {
        fetchStatus();
        const interval = setInterval(fetchStatus, 30000);
        return () => clearInterval(interval);
    }, []);

    const allOnline = nodes.length > 0 && nodes.every((n: NodeStatus) => n.status === 'up');
    const someMaintenance = nodes.some((n: NodeStatus) => n.status === 'maintenance');
    const someDown = nodes.some((n: NodeStatus) => n.status === 'down');

    return (
        <PageContentBlock title={t('public_status.title')}>
            <Container>
                <div css={tw`mb-2`}>
                    <h1 css={tw`text-3xl font-extrabold text-neutral-50 flex items-center gap-3`}>
                        <ShieldCheckIcon css={tw`w-8 h-8 text-blue-400`} />
                        {t('public_status.title')}
                    </h1>
                </div>

                {loading && nodes.length === 0 ? (
                    <div css={tw`flex justify-center py-20`}>
                        <Spinner size={'large'} />
                    </div>
                ) : nodes.length > 0 ? (
                    <>
                        <StatusBanner $allOnline={allOnline} $someMaintenance={someMaintenance || someDown}>
                            {allOnline ? (
                                <CheckCircleIcon css={tw`w-10 h-10`} />
                            ) : (
                                <ExclamationCircleIcon css={tw`w-10 h-10`} />
                            )}
                            <div>
                                <h2 css={tw`text-xl font-bold`}>
                                    {allOnline
                                        ? t('public_status.all_operational')
                                        : someDown
                                            ? t('public_status.degraded_performance')
                                            : t('public_status.partial_maintenance')
                                    }
                                </h2>
                                <p css={tw`text-sm opacity-80`}>
                                    {t('public_status.last_checked')}: {(() => {
                                        try {
                                            return new Date().toLocaleTimeString(i18n.language ? i18n.language.replace('_', '-') : 'en-US');
                                        } catch (e) {
                                            return new Date().toLocaleTimeString();
                                        }
                                    })()}
                                </p>
                            </div>
                        </StatusBanner>

                        <div css={tw`space-y-4`}>
                            {nodes.map((node: NodeStatus) => (
                                <NodeCard key={node.id}>
                                    <div css={tw`flex items-center gap-4 min-w-[200px]`}>
                                        <div css={tw`p-2.5 bg-neutral-700/50 rounded-lg text-neutral-300 border border-neutral-600/30`}>
                                            <ServerIcon css={tw`w-6 h-6`} />
                                        </div>
                                        <div css={tw`flex flex-col`}>
                                            <h3 css={tw`text-lg font-bold text-neutral-100 leading-tight`}>{node.name}</h3>
                                            <div css={tw`flex items-center gap-1 text-neutral-400 text-xs mt-1`}>
                                                <LocationMarkerIcon css={tw`w-3 h-3`} />
                                                {node.location}
                                            </div>
                                        </div>
                                    </div>

                                    <HeartbeatBar>
                                        {[...Array(40)].map((_, i) => (
                                            <HeartbeatTick
                                                key={i}
                                                $status={node.status}
                                                title={node.status === 'up' ? t('public_status.operational') : node.status === 'maintenance' ? t('public_status.maintenance') : t('public_status.offline')}
                                                style={{ opacity: 0.3 + (i / 40) * 0.7 }}
                                            />
                                        ))}
                                    </HeartbeatBar>

                                    <div css={tw`flex flex-col items-end min-w-[120px] gap-1`}>
                                        <StatusText $status={node.status}>
                                            {node.status === 'up' ? t('public_status.operational') : node.status === 'maintenance' ? t('public_status.maintenance') : t('public_status.offline')}
                                            {node.status === 'up' ? <CheckCircleIcon css={tw`w-4 h-4`} /> : <ExclamationCircleIcon css={tw`w-4 h-4`} />}
                                        </StatusText>
                                        <div css={tw`flex gap-3 mt-1`}>
                                            <div css={tw`flex flex-col items-end`}>
                                                <span css={tw`text-[10px] text-neutral-500 uppercase font-black`}>{t('public_status.memory')}</span>
                                                <span css={tw`text-xs font-mono text-neutral-300`}>{bytesToString(node.memory * 1024 * 1024)}</span>
                                            </div>
                                            <div css={tw`flex flex-col items-end`}>
                                                <span css={tw`text-[10px] text-neutral-500 uppercase font-black`}>{t('public_status.disk')}</span>
                                                <span css={tw`text-xs font-mono text-neutral-300`}>{bytesToString(node.disk * 1024 * 1024)}</span>
                                            </div>
                                        </div>
                                    </div>
                                </NodeCard>
                            ))}
                        </div>
                    </>
                ) : (
                    <div css={tw`text-center py-20 text-neutral-500`}>
                        <GlobeAltIcon css={tw`w-12 h-12 mx-auto mb-4 opacity-20`} />
                        <p>{t('public_status.no_nodes') || 'No nodes currently sharing status.'}</p>
                    </div>
                )}


                <LanguageSelectorCard title="Select Language">
                    <GlobeAltIcon css={tw`w-4 h-4 text-neutral-400`} />
                    <select
                        value={i18n.language}
                        onChange={(e: React.ChangeEvent<HTMLSelectElement>) => i18n.changeLanguage(e.target.value)}
                    >
                        {languages.map((lang) => (
                            <option key={lang.code} value={lang.code} css={tw`bg-neutral-800 text-white`}>
                                {lang.name}
                            </option>
                        ))}
                    </select>
                </LanguageSelectorCard>
            </Container>
        </PageContentBlock>
    );
};
