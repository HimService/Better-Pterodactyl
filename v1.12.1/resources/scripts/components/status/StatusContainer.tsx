import React, { useEffect, useState } from 'react';
import PageContentBlock from '@/components/elements/PageContentBlock';
import { useTranslation } from 'react-i18next';
import tw from 'twin.macro';
import styled from 'styled-components/macro';
import Spinner from '@/components/elements/Spinner';
import { bytesToString } from '@/lib/formatters';
import {
    ServerIcon,
    LocationMarkerIcon,
    CheckCircleIcon,
    ExclamationCircleIcon,
    ShieldCheckIcon,
    GlobeAltIcon,
    ChevronDownIcon,
    ChevronUpIcon,
    ChipIcon,
    DatabaseIcon,
    SwitchHorizontalIcon,
    ChartBarIcon
} from '@heroicons/react/solid';
import axios from 'axios';

const Container = styled.div`
    ${tw`flex flex-col gap-6 max-w-5xl mx-auto w-full px-4 mb-20`};
`;

const StatusBanner = styled.div<{ $allOnline: boolean; $someMaintenance: boolean }>`
    ${tw`flex items-center gap-4 p-6 rounded-2xl border transition-all duration-500 mb-4`};
    ${(props: { $allOnline: boolean; $someMaintenance: boolean }) => props.$allOnline ? tw`bg-green-500/10 border-green-500/20 text-green-400` :
        props.$someMaintenance ? tw`bg-yellow-500/10 border-yellow-500/20 text-yellow-500` :
            tw`bg-red-500/10 border-red-500/20 text-red-500`};
    box-shadow: 0 8px 32px -8px ${(props: { $allOnline: boolean; $someMaintenance: boolean }) => props.$allOnline ? 'rgba(34, 197, 94, 0.2)' :
        props.$someMaintenance ? 'rgba(234, 179, 8, 0.2)' :
            'rgba(239, 68, 68, 0.2)'};
`;

const NodeCard = styled.div<{ $offline?: boolean; $expanded?: boolean }>`
    ${tw`relative bg-neutral-800/40 rounded-xl p-5 transition-all duration-300 border border-neutral-700/50 flex flex-col gap-4 overflow-hidden`};
    ${(props: { $expanded?: boolean }) => props.$expanded && tw`bg-neutral-800/80 border-blue-500/30`};
    backdrop-filter: blur(12px);
    cursor: pointer;

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
    ${(props: { $status: 'up' | 'down' | 'maintenance' }) => props.$status === 'up' ? tw`bg-green-400` :
        props.$status === 'maintenance' ? tw`bg-yellow-400` :
            tw`bg-red-400`};
    opacity: 0.8;
    &:hover { opacity: 1; }
`;

const StatusText = styled.span<{ $status: 'up' | 'down' | 'maintenance' }>`
    ${tw`flex items-center gap-1.5 font-bold text-sm tracking-wide`};
    ${(props: { $status: 'up' | 'down' | 'maintenance' }) => props.$status === 'up' ? tw`text-green-400` :
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
        ${tw`bg-transparent text-neutral-300 border-none outline-none text-sm font-bold cursor-pointer pr-4`};
        appearance: none;
    }

    option {
        ${tw`bg-neutral-900 text-neutral-100`};
    }
`;

const formatUptime = (seconds: number): string => {
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);

    const parts = [];
    if (days > 0) parts.push(`${days}d`);
    if (hours > 0) parts.push(`${hours}h`);
    if (minutes > 0) parts.push(`${minutes}m`);

    return parts.join(' ') || '0m';
};

interface NodeState {
    id: number;
    name: string;
    location: string;
    status: 'up' | 'down' | 'maintenance';
    servers_count: number;
    servers_online: number;
    servers_offline: number;
    memory: number;
    disk: number;
    mem_percent: number;
    disk_percent: number;
    cpu_cores: number;
    wings_version: string;
    os: string;
    kernel: string;
    uptime: number | null;
    load: number[] | null;
    network_rx: number | null;
    network_tx: number | null;
    disk_used: number | null;
    disk_total: number | null;
    memory_total: number;
    memory_used: number;
    hw_mem_percent: number;
    hw_disk_percent: number;
    debug_error: string | null;
}

const languages = [
    { code: 'zh-TW', name: '繁體中文' },
    { code: 'en', name: 'English' },
    { code: 'ja', name: '日本語' },
];

const InfoCard = styled.div`
    ${tw`flex flex-col items-center justify-center p-3 bg-neutral-800/40 rounded-xl border border-neutral-700/30 flex-1 min-w-[100px]`};
    transition: all 0.2s ease;
    &:hover {
        ${tw`bg-neutral-800/60 border-neutral-600/40`};
    }
`;

export default () => {
    const { t, i18n } = useTranslation('translation');
    const [nodes, setNodes] = useState<NodeState[]>([]);
    const [expandedNodes, setExpandedNodes] = useState<number[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchStatus = () => {
        axios.get('/api/public/status')
            .then(({ data }: { data: any }) => {
                if (Array.isArray(data)) {
                    setNodes(data);
                }
            })
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

    const toggleNode = (id: number) => {
        setExpandedNodes((prev: number[]) =>
            prev.includes(id) ? prev.filter((i: number) => i !== id) : [...prev, id]
        );
    };

    const allOnline = nodes.length > 0 && nodes.every((n: NodeState) => n.status === 'up');
    const someMaintenance = nodes.some((n: NodeState) => n.status === 'maintenance');
    const someDown = nodes.some((n: NodeState) => n.status === 'down');

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
                            {nodes.map((data: any) => {
                                const node: NodeState = data;
                                const isExpanded = expandedNodes.includes(node.id);
                                return (
                                    <div key={node.id} css={tw`flex flex-col gap-2`}>
                                        <NodeCard $expanded={isExpanded} onClick={() => toggleNode(node.id)}>
                                            <div css={tw`flex flex-col md:flex-row md:items-center gap-4 w-full`}>
                                                <div css={tw`flex items-center gap-4 md:min-w-[200px] w-full md:w-auto`}>
                                                    <div css={tw`p-2.5 bg-neutral-700/50 rounded-lg text-neutral-300 border border-neutral-600/30 flex-shrink-0`}>
                                                        <ServerIcon css={tw`w-6 h-6`} />
                                                    </div>
                                                    <div css={tw`flex flex-col overflow-hidden`}>
                                                        <h3 css={tw`text-lg font-bold text-neutral-100 leading-tight truncate`}>{node.name}</h3>
                                                        <div css={tw`flex items-center gap-1 text-neutral-400 text-xs mt-1 truncate`}>
                                                            <LocationMarkerIcon css={tw`w-3 h-3 flex-shrink-0`} />
                                                            <span css={tw`truncate`}>{node.location}</span>
                                                        </div>
                                                    </div>
                                                </div>

                                                <div css={tw`flex-1 flex flex-wrap items-center justify-center lg:justify-start gap-3 md:gap-4 w-full md:px-4`}>
                                                    <InfoCard>
                                                        <span css={tw`text-[10px] uppercase tracking-wider text-neutral-500 font-bold mb-1`}>WINGS</span>
                                                        <span css={tw`text-[10px] text-neutral-400 font-medium`}>{node.wings_version.startsWith('v') ? node.wings_version : `v${node.wings_version}`}</span>
                                                    </InfoCard>
                                                    <InfoCard>
                                                        <span css={tw`text-[10px] uppercase tracking-wider text-neutral-500 font-bold mb-1`}>{t('public_status.cpu_cores')}</span>
                                                        <span css={tw`text-xl font-black text-neutral-200`}>{node.cpu_cores}</span>
                                                    </InfoCard>
                                                    <InfoCard>
                                                        <span css={tw`text-[10px] uppercase tracking-wider text-neutral-500 font-bold mb-1`}>{t('public_status.memory')}</span>
                                                        <div css={tw`flex flex-col items-center`}>
                                                            <div css={tw`flex items-center gap-1`}>
                                                                <div css={tw`h-1.5 w-16 bg-neutral-800 rounded-full overflow-hidden`}>
                                                                    <div
                                                                        css={[
                                                                            tw`h-full transition-all duration-500`,
                                                                            node.mem_percent > 90 ? tw`bg-red-500` : node.mem_percent > 70 ? tw`bg-yellow-500` : tw`bg-green-500`,
                                                                            { width: `${Math.min(node.mem_percent, 100)}%` }
                                                                        ]}
                                                                    />
                                                                </div>
                                                                <span css={[tw`text-[11px] font-bold`, node.mem_percent > 90 ? tw`text-red-400` : tw`text-neutral-300`]}>{node.mem_percent}%</span>
                                                            </div>
                                                        </div>
                                                    </InfoCard>

                                                    <InfoCard css={tw`hidden sm:flex`}>
                                                        <span css={tw`text-[10px] uppercase tracking-wider text-neutral-500 font-bold mb-1`}>{t('public_status.disk')}</span>
                                                        <div css={tw`flex flex-col items-center`}>
                                                            <div css={tw`flex items-center gap-1`}>
                                                                <div css={tw`h-1.5 w-16 bg-neutral-800 rounded-full overflow-hidden`}>
                                                                    <div
                                                                        css={[
                                                                            tw`h-full transition-all duration-500`,
                                                                            node.disk_percent > 90 ? tw`bg-red-500` : node.disk_percent > 70 ? tw`bg-yellow-500` : tw`bg-green-500`,
                                                                            { width: `${Math.min(node.disk_percent, 100)}%` }
                                                                        ]}
                                                                    />
                                                                </div>
                                                                <span css={[tw`text-[11px] font-bold`, node.disk_percent > 90 ? tw`text-red-400` : tw`text-neutral-300`]}>{node.disk_percent}%</span>
                                                            </div>
                                                        </div>
                                                    </InfoCard>
                                                </div>

                                                <div css={tw`flex flex-row md:flex-col items-center md:items-end justify-between md:justify-center w-full md:w-auto md:min-w-[120px] gap-2 p-1 md:p-0`}>
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                                        <StatusText $status={node.status}>
                                                            {node.status === 'up' ? t('public_status.operational') : node.status === 'maintenance' ? t('public_status.maintenance') : t('public_status.offline')}
                                                            {node.status === 'up' ? <CheckCircleIcon css={tw`w-4 h-4`} /> : <ExclamationCircleIcon css={tw`w-4 h-4`} />}
                                                        </StatusText>
                                                        <ChevronDownIcon css={[tw`w-5 h-5 text-neutral-500 transition-transform duration-300`, isExpanded && tw`rotate-180`]} />
                                                    </div>
                                                </div>
                                            </div>

                                            {isExpanded && (
                                                <div css={tw`mt-6 pt-6 border-t border-neutral-800/50 animate-fade-in-up flex flex-col gap-6`}>
                                                    <div css={tw`grid grid-cols-1 lg:grid-cols-3 gap-6`}>
                                                        {/* Column 1: System Info */}
                                                        <div css={tw`bg-neutral-900/40 rounded-xl p-4 border border-neutral-800/50 flex flex-col gap-4`}>
                                                            <div css={tw`flex items-center gap-2 text-blue-400`}>
                                                                <GlobeAltIcon css={tw`w-4 h-4`} />
                                                                <span css={tw`text-xs font-bold uppercase tracking-wider font-mono`}>{t('public_status.node_info')}</span>
                                                            </div>
                                                            <div css={tw`grid grid-cols-2 gap-x-4 gap-y-3 font-mono text-[10px]`}>
                                                                <div css={tw`flex flex-col`}>
                                                                    <span css={tw`text-neutral-600 uppercase mb-0.5`}>{t('public_status.os_version')}</span>
                                                                    <span css={tw`text-neutral-400 truncate`}>{node.os}</span>
                                                                </div>
                                                                <div css={tw`flex flex-col`}>
                                                                    <span css={tw`text-neutral-600 uppercase mb-0.5`}>WINGS</span>
                                                                    <span css={tw`text-cyan-400 font-bold`}>{node.wings_version}</span>
                                                                </div>
                                                                <div css={tw`flex flex-col col-span-2`}>
                                                                    <span css={tw`text-neutral-600 uppercase mb-0.5`}>{t('public_status.kernel')}</span>
                                                                    <span css={tw`text-neutral-500 italic truncate`}>{node.kernel}</span>
                                                                </div>
                                                                <div css={tw`flex flex-col col-span-2 pt-2 border-t border-neutral-800/30`}>
                                                                    <span css={tw`text-neutral-600 uppercase mb-0.5`}>{t('public_status.uptime')}</span>
                                                                    <span css={tw`text-neutral-300 font-bold`}>{node.uptime ? formatUptime(node.uptime) : t('public_status.uptime_none')}</span>
                                                                </div>
                                                            </div>
                                                        </div>

                                                        {/* Column 2: Hardware Resources */}
                                                        <div css={tw`bg-neutral-900/40 rounded-xl p-4 border border-neutral-800/50 flex flex-col gap-4`}>
                                                            <div css={tw`flex items-center gap-2 text-green-400`}>
                                                                <ChipIcon css={tw`w-4 h-4`} />
                                                                <span css={tw`text-xs font-bold uppercase tracking-wider font-mono`}>{t('public_status.hardware_resources')}</span>
                                                            </div>
                                                            <div css={tw`flex flex-col gap-4`}>
                                                                <div css={tw`flex flex-col`}>
                                                                    <div css={tw`flex justify-between items-center mb-1`}>
                                                                        <span css={tw`text-[10px] text-neutral-500 uppercase font-bold font-mono`}>{t('public_status.memory_real_usage')}</span>
                                                                        <span css={tw`text-[10px] text-green-400 font-bold`}>{node.hw_mem_percent}%</span>
                                                                    </div>
                                                                    <div css={tw`h-1.5 w-full bg-neutral-800 rounded-full overflow-hidden`}>
                                                                        <div css={[tw`h-full bg-green-500`, { width: `${Math.min(node.hw_mem_percent, 100)}%` }]} />
                                                                    </div>
                                                                    <div css={tw`flex justify-between mt-1 text-[9px] font-mono text-neutral-600 uppercase`}>
                                                                        <span>{bytesToString(node.memory_used)}</span>
                                                                        <span>{bytesToString(node.memory_total)}</span>
                                                                    </div>
                                                                </div>
                                                                <div css={tw`flex flex-col`}>
                                                                    <div css={tw`flex justify-between items-center mb-1`}>
                                                                        <span css={tw`text-[10px] text-neutral-500 uppercase font-bold font-mono`}>{t('public_status.disk_real_usage')}</span>
                                                                        <span css={tw`text-[10px] text-purple-400 font-bold`}>{node.hw_disk_percent}%</span>
                                                                    </div>
                                                                    <div css={tw`h-1.5 w-full bg-neutral-800 rounded-full overflow-hidden`}>
                                                                        <div css={[tw`h-full bg-purple-500`, { width: `${Math.min(node.hw_disk_percent, 100)}%` }]} />
                                                                    </div>
                                                                    <div css={tw`flex justify-between mt-1 text-[9px] font-mono text-neutral-600 uppercase`}>
                                                                        <span>{bytesToString(node.disk_used || 0)}</span>
                                                                        <span>{bytesToString(node.disk_total || 0)}</span>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </div>

                                                        {/* Column 3: Allocation Stats */}
                                                        <div css={tw`bg-neutral-900/40 rounded-xl p-4 border border-neutral-800/50 flex flex-col gap-4`}>
                                                            <div css={tw`flex items-center gap-2 text-yellow-400`}>
                                                                <ChartBarIcon css={tw`w-4 h-4`} />
                                                                <span css={tw`text-xs font-bold uppercase tracking-wider font-mono`}>{t('public_status.allocation_stats')}</span>
                                                            </div>
                                                            <div css={tw`flex flex-col gap-4`}>
                                                                <div css={tw`grid grid-cols-3 gap-2 text-center py-2 bg-black/20 rounded-lg`}>
                                                                    <div css={tw`flex flex-col`}>
                                                                        <span css={tw`text-xl font-black text-green-400`}>{node.servers_online}</span>
                                                                        <span css={tw`text-[8px] text-neutral-600 uppercase font-bold`}>{t('public_status.server_online')}</span>
                                                                    </div>
                                                                    <div css={tw`flex flex-col border-l border-r border-neutral-800/50`}>
                                                                        <span css={tw`text-xl font-black text-red-400`}>{node.servers_offline}</span>
                                                                        <span css={tw`text-[8px] text-neutral-600 uppercase font-bold`}>{t('public_status.server_offline')}</span>
                                                                    </div>
                                                                    <div css={tw`flex flex-col`}>
                                                                        <span css={tw`text-xl font-black text-neutral-400`}>{node.servers_count}</span>
                                                                        <span css={tw`text-[8px] text-neutral-600 uppercase font-bold`}>{t('public_status.server_total')}</span>
                                                                    </div>
                                                                </div>
                                                                <div css={tw`flex flex-col`}>
                                                                    <div css={tw`flex justify-between items-end mb-1`}>
                                                                        <span css={tw`text-[10px] text-neutral-500 uppercase font-bold font-mono`}>{t('public_status.memory_allocation')}</span>
                                                                        <span css={[tw`text-[10px] font-bold font-mono`, node.mem_percent > 100 ? tw`text-red-500` : tw`text-neutral-400`]}>{node.mem_percent}%</span>
                                                                    </div>
                                                                    <div css={tw`h-1 w-full bg-neutral-800 rounded-full overflow-hidden`}>
                                                                        <div css={[tw`h-full transition-all duration-500`, node.mem_percent > 100 ? tw`bg-red-500` : tw`bg-blue-500`, { width: `${Math.min(node.mem_percent, 100)}%` }]} />
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            )}
                                        </NodeCard>
                                    </div>
                                );
                            })}
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
