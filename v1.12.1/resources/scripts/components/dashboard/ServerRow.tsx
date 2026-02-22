import React, { memo, useEffect, useRef, useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faEthernet, faHdd, faMemory, faMicrochip, faServer } from '@fortawesome/free-solid-svg-icons';
import { Link } from 'react-router-dom';
import { Server } from '@/api/server/getServer';
import getServerResourceUsage, { ServerPowerState, ServerStats } from '@/api/server/getServerResourceUsage';
import { bytesToString, ip, mbToBytes } from '@/lib/formatters';
import tw from 'twin.macro';
import Spinner from '@/components/elements/Spinner';
import styled, { css } from 'styled-components/macro';
import { useTranslation } from 'react-i18next';

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
    ${({ $status }) =>
        !$status || $status === 'offline'
            ? tw`bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.6)]`
            : $status === 'running'
                ? tw`bg-green-500 shadow-[0_0_8px_rgba(16,185,129,0.6)]`
                : tw`bg-yellow-500 shadow-[0_0_8px_rgba(245,158,11,0.6)] animate-pulse`};
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

export default function ServerRow({ server, className }: { server: Server; className?: string }) {
    const { t } = useTranslation();
    const interval = useRef<Timer>(null) as React.MutableRefObject<Timer>;
    const [isSuspended, setIsSuspended] = useState(server.status === 'suspended');
    const [stats, setStats] = useState<ServerStats | null>(null);

    const getStats = () =>
        getServerResourceUsage(server.uuid)
            .then((data) => setStats(data))
            .catch((error) => console.error(error));

    useEffect(() => {
        setIsSuspended(stats?.isSuspended || server.status === 'suspended');
    }, [stats?.isSuspended, server.status]);

    useEffect(() => {
        if (isSuspended) return;

        getStats().then(() => {
            interval.current = setInterval(() => getStats(), 30000);
        });

        return () => {
            interval.current && clearInterval(interval.current);
        };
    }, [isSuspended]);

    const alarms = { cpu: false, memory: false, disk: false };
    if (stats) {
        alarms.cpu = server.limits.cpu === 0 ? false : stats.cpuUsagePercent >= server.limits.cpu * 0.9;
        alarms.memory = isAlarmState(stats.memoryUsageInBytes, server.limits.memory);
        alarms.disk = server.limits.disk === 0 ? false : isAlarmState(stats.diskUsageInBytes, server.limits.disk);
    }

    return (
        <StatusIndicatorBox to={`/server/${server.id}`} className={className}>
            <StatusDot $status={stats?.status} />

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
                        <StatusPill status={stats?.status} isSuspended={isSuspended} isTransferring={server.isTransferring} />
                    </div>

                    <div css={tw`flex items-center justify-start gap-2 max-w-full overflow-hidden`}>
                        {/* Inline IP Display */}
                        <div css={tw`flex items-center text-[11px] font-mono font-medium whitespace-nowrap overflow-hidden`} style={{ textOverflow: 'ellipsis', color: 'rgb(var(--text-secondary))' }}>
                            {server.allocations
                                .filter((alloc: any) => alloc.isDefault)
                                .map((allocation: any) => (
                                    <span key={allocation.ip + allocation.port.toString()}>
                                        {allocation.alias || ip(allocation.ip)}:{allocation.port}
                                    </span>
                                ))}
                        </div>

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
