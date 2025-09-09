import React, { memo, useEffect, useRef, useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faEthernet, faHdd, faMemory, faMicrochip, faServer } from '@fortawesome/free-solid-svg-icons';
import { Link } from 'react-router-dom';
import { Server } from '@/api/server/getServer';
import getServerResourceUsage, { ServerPowerState, ServerStats } from '@/api/server/getServerResourceUsage';
import { bytesToString, ip, mbToBytes } from '@/lib/formatters';
import tw from 'twin.macro';
import GreyRowBox from '@/components/elements/GreyRowBox';
import Spinner from '@/components/elements/Spinner';
import styled from 'styled-components/macro';
import isEqual from 'react-fast-compare';
import { useStoreState } from '@/state/hooks';
import { Allocation } from '@/api/server/getServer';

// Determines if the current value is in an alarm threshold so we can show it in red rather
// than the more faded default style.
const isAlarmState = (current: number, limit: number): boolean => limit > 0 && current / (limit * 1024 * 1024) >= 0.9;

const Icon = memo(
    styled(FontAwesomeIcon)<{ $alarm: boolean }>`
        ${(props: { $alarm: boolean }) => (props.$alarm ? tw`text-red-400` : tw`text-neutral-500`)};
    `,
    isEqual
);

const IconDescription = styled.p<{ $alarm: boolean }>`
    ${tw`text-sm ml-2`};
    ${(props: { $alarm: boolean }) => (props.$alarm ? tw`text-white` : tw`text-neutral-500`)};
    [data-theme="dark"] & {
        ${(props: { $alarm: boolean }) => (props.$alarm ? tw`text-white` : tw`text-neutral-400`)};
    }
`;

const StatusIndicatorBox = styled(GreyRowBox).attrs({ as: Link })<{
    $status: ServerPowerState | undefined;
    to: string;
}>`
    ${tw`flex flex-col relative border-l-4 transition-all duration-150 bg-neutral-100 rounded-lg shadow-lg hover:shadow-xl backdrop-blur-sm`};

    [data-theme="dark"] & {
        ${tw`bg-neutral-800`}
    }

    &:hover {
        ${tw`shadow-xl border-cyan-500/50`}
    }

    ${({ $status }: { $status: ServerPowerState | undefined }) =>
        !$status || $status === 'offline'
            ? tw`border-red-500`
            : $status === 'running'
            ? tw`border-green-500`
            : tw`border-yellow-500`};

    &:hover {
        ${({ $status }: { $status: ServerPowerState | undefined }) =>
            !$status || $status === 'offline'
                ? tw`border-red-400`
                : $status === 'running'
                ? tw`border-green-400`
                : tw`border-yellow-400`};
    }
`;

const ServerName = styled.p`
    ${tw`text-xl font-bold break-words text-neutral-800`};
    [data-theme="dark"] & {
        ${tw`text-white`}
    }
`;

const ServerIp = styled.p`
    ${tw`text-sm text-neutral-500 break-words line-clamp-2 font-mono`};
    [data-theme="dark"] & {
        ${tw`text-neutral-400`}
    }
`;

const ResourceTitle = styled.p`
    ${tw`text-xs text-neutral-500 uppercase mb-1`};
    [data-theme="dark"] & {
        ${tw`text-neutral-300`}
    }
`;

const ResourceValue = styled.p`
    ${tw`text-sm font-mono text-neutral-800 mb-2`};
    [data-theme="dark"] & {
        ${tw`text-neutral-100`}
    }
`;

const ProgressBar = styled.div`
    ${tw`w-full bg-neutral-200 rounded-full h-1`};
    [data-theme="dark"] & {
        ${tw`bg-neutral-900/50`}
    }
`;

const ServerIconContainer = styled.div`
    ${tw`mr-4 w-14 h-14 rounded-full bg-neutral-200 flex items-center justify-center shadow-inner`};
    [data-theme="dark"] & {
        ${tw`bg-neutral-700`}
    }
`;

const ServerIcon = styled(FontAwesomeIcon)`
    ${tw`text-2xl text-neutral-800`};
    [data-theme="dark"] & {
        ${tw`text-neutral-300`}
    }
`;

export interface ServerResources {
    status: ServerPowerState;
    cpu_absolute: number;
    memory_bytes: number;
    disk_bytes: number;
}

type ExtendedServer = Server & {
    resources?: ServerResources;
    isSuspended?: boolean;
};

export default ({ server: initialServer, className }: { server: ExtendedServer; className?: string }) => {
    const server =
        useStoreState(
            (state: any) => (state.servers?.data ?? []).find((s: ExtendedServer) => s.uuid === initialServer.uuid),
            (a: ExtendedServer | undefined, b: ExtendedServer | undefined) => isEqual(a, b)
        ) || initialServer;

    const interval = useRef<ReturnType<typeof setInterval>>(null) as React.MutableRefObject<ReturnType<typeof setInterval>>;
    const [stats, setStats] = useState<ServerStats | null>(null);

    const getStats = () =>
        getServerResourceUsage(server.uuid)
            .then((data) => setStats(data))
            .catch((error) => console.error(error));

    useEffect(() => {
        if (server.isSuspended) {
            return;
        }

        getStats().then(() => {
            interval.current = setInterval(() => getStats(), 30000);
        });

        return () => {
            interval.current && clearInterval(interval.current);
        };
    }, [server.isSuspended]);

    const diskLimit = server.limits.disk !== 0 ? bytesToString(mbToBytes(server.limits.disk)) : '無限制';
    const memoryLimit = server.limits.memory !== 0 ? bytesToString(mbToBytes(server.limits.memory)) : '無限制';
    const cpuLimit = server.limits.cpu !== 0 ? server.limits.cpu + ' %' : '無限制';

    return (
        <StatusIndicatorBox to={`/server/${server.id}`} className={className} $status={stats?.status}>
            <div css={tw`flex items-center w-full p-4`}>
                <div css={tw`flex-none flex items-center`}>
                    <ServerIconContainer>
                        <ServerIcon icon={faServer} />
                    </ServerIconContainer>
                    <div css={tw`flex-grow`}>
                        <ServerName>{server.name}</ServerName>
                        <ServerIp>
                            {server.allocations
                                .filter((alloc: Allocation) => alloc.isDefault)
                                .map((allocation: Allocation) => (
                                    <React.Fragment key={allocation.ip + allocation.port.toString()}>
                                        {allocation.alias || ip(allocation.ip)}:{allocation.port}
                                    </React.Fragment>
                                ))}
                        </ServerIp>
                    </div>
                </div>
                <div css={tw`flex-grow`}/>
                <div css={tw`w-1/4 flex items-center justify-end`}>
                    {(() => {
                        if (server.isSuspended) {
                            return (
                                <div css={tw`text-center`}>
                                    <span
                                        css={tw`bg-red-600 rounded-full px-3 py-1 text-red-100 text-xs font-semibold uppercase tracking-wider`}
                                    >
                                        {server.status === 'suspended' ? '已暫停' : '連線錯誤'}
                                    </span>
                                </div>
                            );
                        }
                        if (server.isTransferring || ['installing', 'restoring_backup'].includes(server.status || '')) {
                            return (
                                <div css={tw`text-center`}>
                                    <span
                                        css={tw`bg-neutral-600 rounded-full px-3 py-1 text-neutral-100 text-xs font-semibold uppercase tracking-wider`}
                                    >
                                        {server.isTransferring
                                            ? '轉移中'
                                            : server.status === 'installing'
                                            ? '安裝中'
                                            : '還原備份中'}
                                    </span>
                                </div>
                            );
                        }
                        return null;
                    })()}
                </div>
            </div>
            {!server.isSuspended && (
                <div css={tw`w-full px-4 py-3`}>
                    <div css={tw`grid grid-cols-3 gap-6`}>
                        {/* CPU */}
                        <div css={tw`text-center`}>
                            {!stats ?
                                <Spinner size={'small'} />
                                :
                                <>
                                    <ResourceTitle>處理器</ResourceTitle>
                                    <ResourceValue>{stats.cpuUsagePercent.toFixed(2)}%</ResourceValue>
                                    <ProgressBar>
                                        <div css={tw`bg-cyan-500 h-1 rounded-full`} style={{ width: `${stats.cpuUsagePercent}%` }} />
                                    </ProgressBar>
                                </>
                            }
                        </div>
                        {/* Memory */}
                        <div css={tw`text-center`}>
                            {!stats ?
                                <Spinner size={'small'} />
                                :
                                <>
                                    <ResourceTitle>記憶體</ResourceTitle>
                                    <ResourceValue>{bytesToString(stats.memoryUsageInBytes)}</ResourceValue>
                                    <ProgressBar>
                                        <div
                                            css={tw`bg-green-500 h-1 rounded-full`}
                                            style={{ width: `${(stats.memoryUsageInBytes / (server.limits.memory * 1024 * 1024)) * 100}%` }}
                                        />
                                    </ProgressBar>
                                </>
                            }
                        </div>
                        {/* Disk */}
                        <div css={tw`text-center`}>
                            {!stats ?
                                <Spinner size={'small'} />
                                :
                                <>
                                    <ResourceTitle>磁碟空間</ResourceTitle>
                                    <ResourceValue>{bytesToString(stats.diskUsageInBytes)}</ResourceValue>
                                    <ProgressBar>
                                        <div
                                            css={tw`bg-yellow-500 h-1 rounded-full`}
                                            style={{ width: `${(stats.diskUsageInBytes / (server.limits.disk * 1024 * 1024)) * 100}%` }}
                                        />
                                    </ProgressBar>
                                </>
                            }
                        </div>
                    </div>
                </div>
            )}
        </StatusIndicatorBox>
    );
};
