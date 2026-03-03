import React, { memo, useEffect, useRef, useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPlay, faRedo, faStop, faSkull, faCopy, faEthernet, faHdd, faMemory, faMicrochip, faServer } from '@fortawesome/free-solid-svg-icons';
import { Link } from 'react-router-dom';
import { Server } from '@/api/server/getServer';
import getServerResourceUsage, { ServerPowerState, ServerStats } from '@/api/server/getServerResourceUsage';
import sendPowerAction from '@/api/server/sendPowerAction';
import { bytesToString, ip, mbToBytes } from '@/lib/formatters';
import tw from 'twin.macro';
import Spinner from '@/components/elements/Spinner';
import styled, { css } from 'styled-components/macro';
import { useTranslation } from 'react-i18next';
import useFlash from '@/plugins/useFlash';
import CopyOnClick from '@/components/elements/CopyOnClick';

const isAlarmState = (current: number, limit: number): boolean => limit > 0 && current / (limit * 1024 * 1024) >= 0.9;

const StatusIndicatorBox = styled(Link)`
    ${tw`flex flex-col sm:flex-row items-center justify-between px-5 py-4 w-full transition-all duration-300 no-underline relative gap-4 sm:gap-6 overflow-hidden backdrop-blur-md`};
    background-color: rgba(var(--bg-card), 0.85);
    border: 1px solid rgba(var(--border-color), 0.5);
    border-radius: var(--radius-card, 1rem);
    color: rgb(var(--text-secondary));
    box-shadow: var(--shadow-card, 0 4px 6px -1px rgba(0, 0, 0, 0.1));

    &:hover {
        background-color: rgba(var(--bg-card-hover), 0.95);
        border-color: rgba(var(--color-brand-500), 0.4);
        box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
        transform: translateY(-2px);
    }
`;

const IconContainer = styled.div`
    ${tw`flex items-center justify-center w-11 h-11 rounded-xl flex-shrink-0 transition-colors duration-300`};
    background-color: rgba(var(--color-brand-500), 0.1);
    color: rgb(var(--color-brand-600));
`;

const StatusDot = styled.div<{ $status: ServerPowerState | undefined }>`
    ${tw`absolute top-0 right-0 w-2 h-2 rounded-full m-4 transition-all duration-300 z-10`};
    
    background-color: ${({ $status }) =>
        !$status || $status === 'offline' ? '#ef4444' :
            $status === 'running' ? '#10b981' : '#f59e0b'};
    
    box-shadow: ${({ $status }) =>
        !$status || $status === 'offline' ? '0 0 8px rgba(239,68,68,0.6)' :
            $status === 'running' ? '0 0 8px rgba(16,185,129,0.6)' : '0 0 8px rgba(245,158,11,0.6)'};
    
    ${({ $status }) => ($status !== 'offline' && $status !== 'running' && $status !== undefined) ? tw`animate-pulse` : undefined};
`;

const ProgressBarContainer = styled.div`
    ${tw`h-[3px] w-full rounded-full overflow-hidden mt-1.5`};
    background-color: rgba(var(--text-secondary), 0.2);
`;

const ProgressBar = styled.div<{ $percent: number; $alarm: boolean }>`
    ${tw`h-full rounded-full transition-all duration-500 ease-out`};
    width: ${(props) => Math.min(props.$percent, 100)}%;
    ${(props) => props.$alarm ? tw`bg-red-500` : css`background-color: rgb(var(--color-brand-500));`};
`;

const ServerName = styled.h3`
    ${tw`text-base font-semibold truncate m-0 tracking-tight`};
    color: rgb(var(--text-primary));
`;

const StatLabel = styled.span`
    ${tw`text-[10px] uppercase font-bold tracking-widest`};
    color: rgb(var(--text-secondary));
`;

const StatValue = styled.span<{ $alarm?: boolean }>`
    ${tw`text-[11px] font-mono font-medium ml-2`};
    ${(props) => props.$alarm ? tw`text-red-500` : css`color: rgb(var(--text-primary));`};
`;

const ActionButton = styled.button`
    ${tw`flex items-center justify-center w-8 h-8 rounded-lg transition-all duration-200 border border-transparent`};
    background-color: rgba(var(--text-secondary), 0.1);
    color: rgb(var(--text-secondary));

    &:hover:not(:disabled) {
        ${tw`scale-105 shadow-sm`};
    }

    &:disabled {
        ${tw`opacity-30 cursor-not-allowed`};
    }
`;

const StatusPill = ({ status, isSuspended, isTransferring }: { status: ServerPowerState | undefined, isSuspended: boolean, isTransferring: boolean }) => {
    const { t } = useTranslation();
    if (isSuspended) {
        return <span css={tw`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-red-500/10 text-red-500 border border-red-500/20`}>{t('dashboard.server_row.suspended', 'Suspended')}</span>;
    }
    if (isTransferring) {
        return <span css={tw`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-yellow-500/10 text-yellow-500 border border-yellow-500/20`}>{t('dashboard.server_row.transferring', 'Transferring')}</span>;
    }
    if (status === 'offline' || !status) {
        return <span css={tw`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-gray-500/10 text-gray-400 border border-gray-500/20`}>{t('dashboard.server_row.offline', 'Offline')}</span>;
    }
    if (status === 'running') {
        return <span css={tw`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-green-500/10 text-green-500 border border-green-500/20`}>{t('dashboard.server_row.running', 'Running')}</span>;
    }
    return <span css={tw`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-yellow-500/10 text-yellow-500 border border-yellow-500/20 animate-pulse`}>{t('dashboard.server_row.starting', 'Starting')}</span>;
}

type Timer = ReturnType<typeof setInterval>;

export default function ServerRow({ server, className, isBatchMode, isSelected, onSelect, isBatchProcessing, batchActionType }: { server: Server; className?: string; isBatchMode?: boolean; isSelected?: boolean; onSelect?: (id: string) => void; isBatchProcessing?: boolean; batchActionType?: 'start' | 'stop' | 'restart' | 'kill' | null }) {
    const { t } = useTranslation();
    const { addFlash, clearFlashes } = useFlash();
    const interval = useRef<Timer>(null) as React.MutableRefObject<Timer>;
    const [isSuspended, setIsSuspended] = useState(server.status === 'suspended');
    const [stats, setStats] = useState<ServerStats | null>(null);
    const [isActionLoading, setIsActionLoading] = useState(false);
    const [optimisticStatus, setOptimisticStatus] = useState<ServerPowerState | null>(null);

    // Apply optimistic status from batch actions
    useEffect(() => {
        if (isBatchProcessing && batchActionType) {
            if (batchActionType === 'start') setOptimisticStatus('starting');
            if (batchActionType === 'stop' || batchActionType === 'kill') setOptimisticStatus('stopping');
            if (batchActionType === 'restart') setOptimisticStatus('starting');
        }
    }, [isBatchProcessing, batchActionType]);

    // Clear optimistic status when stats catches up or after timeout
    useEffect(() => {
        if (!optimisticStatus) return;

        let timeout: Timer;
        if (
            (optimisticStatus === 'starting' && (stats?.status === 'starting' || stats?.status === 'running')) ||
            (optimisticStatus === 'stopping' && (stats?.status === 'stopping' || stats?.status === 'offline'))
        ) {
            setOptimisticStatus(null);
        } else {
            // Fallback to clear it after 15 seconds if it didn't catch up
            timeout = setTimeout(() => {
                setOptimisticStatus(null);
            }, 15000);
        }

        return () => {
            if (timeout) clearTimeout(timeout);
        };
    }, [stats?.status, optimisticStatus]);

    // Derived status
    const displayStatus = optimisticStatus || stats?.status;

    const getStats = () =>
        getServerResourceUsage(server.uuid)
            .then((data) => setStats(data))
            .catch((error) => console.error(error));

    useEffect(() => {
        setIsSuspended(stats?.isSuspended || server.status === 'suspended');
    }, [stats?.isSuspended, server.status]);

    useEffect(() => {
        if (isSuspended) return;

        getStats();
        interval.current = setInterval(() => getStats(), 3000);

        return () => {
            interval.current && clearInterval(interval.current);
        };
    }, [isSuspended]);

    const onPowerAction = (e: React.MouseEvent, action: 'start' | 'stop' | 'restart' | 'kill') => {
        e.preventDefault();
        e.stopPropagation();
        setIsActionLoading(true);
        if (action === 'start') setOptimisticStatus('starting');
        if (action === 'stop' || action === 'kill') setOptimisticStatus('stopping');
        if (action === 'restart') setOptimisticStatus('starting');
        clearFlashes('dashboard');

        // Reverting to lowercase actions and server.id (short identifier)
        sendPowerAction(server.id, action)
            .then(() => {
                // Immediate follow-up ensures we catch the state transition quickly
                getStats();
                setTimeout(() => getStats(), 1000);
                setTimeout(() => getStats(), 3000);
            })
            .catch((error) => addFlash({ key: 'dashboard', type: 'error', message: error.message }))
            .finally(() => setIsActionLoading(false));
    };

    const alarms = { cpu: false, memory: false, disk: false };
    if (stats) {
        alarms.cpu = server.limits.cpu === 0 ? false : stats.cpuUsagePercent >= server.limits.cpu * 0.9;
        alarms.memory = isAlarmState(stats.memoryUsageInBytes, server.limits.memory);
        alarms.disk = server.limits.disk === 0 ? false : isAlarmState(stats.diskUsageInBytes, server.limits.disk);
    }

    const defaultAllocation = server.allocations.find((alloc) => alloc.isDefault);
    const connectionAddress = defaultAllocation ? `${defaultAllocation.alias || ip(defaultAllocation.ip)}:${defaultAllocation.port}` : '';

    return (
        <StatusIndicatorBox
            to={isBatchMode ? '#' : `/server/${server.id}`}
            className={className}
            onClick={(e) => {
                if (isBatchMode) {
                    e.preventDefault();
                    onSelect?.(server.id);
                }
            }}
            style={isBatchMode && isSelected ? { borderColor: 'rgb(var(--color-brand-500))', backgroundColor: 'rgba(var(--color-brand-600), 0.1)' } : {}}
        >
            {isBatchMode && (
                <div css={tw`flex items-center justify-center pr-4`}>
                    <div
                        css={[
                            tw`w-5 h-5 rounded border-2 flex items-center justify-center transition-all duration-200`,
                            isSelected
                                ? tw`bg-brand-500 border-brand-500 text-white`
                                : tw`border-white/20 bg-white/5`
                        ]}
                    >
                        {isSelected && <div css={tw`w-2 h-2 bg-white rounded-sm`} />}
                    </div>
                </div>
            )}
            <StatusDot $status={displayStatus} />

            {/* Left Section: Icon, Name, IPs */}
            <div css={tw`flex items-center flex-1 min-w-0 w-full sm:w-auto`}>
                <IconContainer css={tw`mr-5`}>
                    <FontAwesomeIcon icon={faServer} size={'1x'} />
                </IconContainer>

                <div css={tw`flex flex-col min-w-0 flex-1`}>
                    <div css={tw`flex items-center gap-3 mb-1`}>
                        <ServerName>
                            {server.name}
                        </ServerName>
                        <StatusPill status={displayStatus} isSuspended={isSuspended} isTransferring={server.isTransferring} />
                    </div>

                    <div css={tw`flex items-center justify-start gap-2 max-w-full overflow-hidden`}>
                        {/* Inline IP Display with Copy */}
                        <CopyOnClick text={connectionAddress} showInNotification={false}>
                            <div
                                className={'group'}
                                css={tw`flex items-center text-[11px] font-mono font-medium whitespace-nowrap overflow-hidden hover:text-brand-500 transition-colors duration-200`}
                                style={{ textOverflow: 'ellipsis', color: 'rgb(var(--text-secondary))' }}
                                onClick={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                }}
                            >
                                <span css={tw`mr-1.5 opacity-50`}>
                                    <FontAwesomeIcon icon={faEthernet} />
                                </span>
                                <span>{connectionAddress}</span>
                                <span css={tw`ml-1.5 text-[9px] opacity-0 group-hover:opacity-100 transition-opacity`}>
                                    <FontAwesomeIcon icon={faCopy} />
                                </span>
                            </div>
                        </CopyOnClick>

                        {/* Description */}
                        {!!server.description && (
                            <React.Fragment>
                                <span css={tw`hidden sm:block flex-shrink-0`} style={{ color: 'rgb(var(--text-secondary))' }}>•</span>
                                <p css={tw`text-[11px] truncate font-medium hidden sm:block min-w-0`} style={{ color: 'rgb(var(--text-secondary))' }}>
                                    {server.description}
                                </p>
                            </React.Fragment>
                        )}
                    </div>
                </div>
            </div>

            {/* Quick Actions */}
            {!isSuspended && !server.isTransferring && (
                <div
                    css={tw`flex items-center gap-2 px-2 border-r border-white/5 mr-2 hidden lg:flex`}
                    onClick={(e) => e.stopPropagation()}
                >
                    <ActionButton
                        disabled={isActionLoading || displayStatus === 'running' || displayStatus === 'starting'}
                        onClick={(e) => onPowerAction(e, 'start')}
                        css={displayStatus === 'offline' ? tw`text-green-500 bg-green-500/10 hover:bg-green-500/20` : undefined}
                    >
                        <FontAwesomeIcon icon={faPlay} className={'text-[10px]'} />
                    </ActionButton>
                    <ActionButton
                        disabled={isActionLoading || !displayStatus || displayStatus === 'offline'}
                        onClick={(e) => onPowerAction(e, 'restart')}
                        css={displayStatus === 'running' ? tw`text-yellow-500 bg-yellow-500/10 hover:bg-yellow-500/20` : undefined}
                    >
                        <FontAwesomeIcon icon={faRedo} className={'text-[10px]'} />
                    </ActionButton>
                    <ActionButton
                        disabled={isActionLoading || displayStatus === 'offline'}
                        onClick={(e) => onPowerAction(e, displayStatus === 'stopping' ? 'kill' : 'stop')}
                        css={displayStatus === 'running' ? tw`text-red-500 bg-red-500/10 hover:bg-red-500/20` : undefined}
                    >
                        <FontAwesomeIcon icon={displayStatus === 'stopping' ? faSkull : faStop} className={'text-[10px]'} />
                    </ActionButton>
                </div>
            )}

            {/* Right Section: Stats */}
            <div css={tw`flex items-center justify-end w-full sm:w-[320px] lg:w-[420px] flex-shrink-0 gap-4 lg:gap-6`}>
                {!stats || isSuspended ? (
                    !isSuspended && !server.isTransferring && !server.status && <Spinner size={'small'} />
                ) : (
                    <React.Fragment>
                        <div css={tw`flex-1 min-w-0`}>
                            <div css={tw`flex justify-between items-end mb-1`}>
                                <div css={tw`flex items-center gap-1.5`}>
                                    <FontAwesomeIcon icon={faMicrochip} css={tw`text-[10px] hidden lg:block`} style={{ color: 'rgb(var(--text-secondary))' }} />
                                    <StatLabel css={tw`hidden sm:block`}>{t('dashboard.server_row.cpu', 'CPU')}</StatLabel>
                                </div>
                                <StatValue $alarm={alarms.cpu}>{stats.cpuUsagePercent.toFixed(1)}%</StatValue>
                            </div>
                            <ProgressBarContainer>
                                <ProgressBar $percent={server.limits.cpu === 0 ? 0 : (stats.cpuUsagePercent / server.limits.cpu) * 100} $alarm={alarms.cpu} />
                            </ProgressBarContainer>
                        </div>

                        <div css={tw`flex-1 min-w-0`}>
                            <div css={tw`flex justify-between items-end mb-1`}>
                                <div css={tw`flex items-center gap-1.5`}>
                                    <FontAwesomeIcon icon={faMemory} css={tw`text-[10px] hidden lg:block`} style={{ color: 'rgb(var(--text-secondary))' }} />
                                    <StatLabel css={tw`hidden sm:block`}>{t('dashboard.server_row.memory', 'Memory')}</StatLabel>
                                </div>
                                <StatValue $alarm={alarms.memory}>{bytesToString(stats.memoryUsageInBytes)}</StatValue>
                            </div>
                            <ProgressBarContainer>
                                <ProgressBar $percent={server.limits.memory === 0 ? 0 : (stats.memoryUsageInBytes / mbToBytes(server.limits.memory)) * 100} $alarm={alarms.memory} />
                            </ProgressBarContainer>
                        </div>

                        <div css={tw`flex-1 min-w-0 hidden sm:block`}>
                            <div css={tw`flex justify-between items-end mb-1`}>
                                <div css={tw`flex items-center gap-1.5`}>
                                    <FontAwesomeIcon icon={faHdd} css={tw`text-[10px] hidden lg:block`} style={{ color: 'rgb(var(--text-secondary))' }} />
                                    <StatLabel>{t('dashboard.server_row.disk', 'Disk')}</StatLabel>
                                </div>
                                <StatValue $alarm={alarms.disk}>{bytesToString(stats.diskUsageInBytes)}</StatValue>
                            </div>
                            <ProgressBarContainer>
                                <ProgressBar $percent={server.limits.disk === 0 ? 0 : (stats.diskUsageInBytes / mbToBytes(server.limits.disk)) * 100} $alarm={alarms.disk} />
                            </ProgressBarContainer>
                        </div>
                    </React.Fragment>
                )}
            </div>
        </StatusIndicatorBox>
    );
}
