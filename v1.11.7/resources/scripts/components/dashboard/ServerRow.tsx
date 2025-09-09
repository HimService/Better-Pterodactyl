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
import { ApplicationStore, useStoreState } from '@/state';
import { Allocation } from '@/api/server/getServer';

// Determines if the current value is in an alarm threshold so we can show it in red rather
// than the more faded default style.
const isAlarmState = (current: number, limit: number): boolean => limit > 0 && current / (limit * 1024 * 1024) >= 0.9;

const Icon = memo(
    styled(FontAwesomeIcon)<{ $alarm: boolean }>`
        ${(props) => (props.$alarm ? tw`text-red-400` : tw`text-neutral-500`)};
    `,
    isEqual
);

const IconDescription = styled.p<{ $alarm: boolean }>`
    ${tw`text-sm ml-2`};
    ${(props) => (props.$alarm ? tw`text-white` : tw`text-neutral-400`)};
`;

const StatusIndicatorBox = styled(GreyRowBox).attrs({ as: Link })<{
    $status: ServerPowerState | undefined;
    to: string;
}>`
    ${tw`flex flex-col relative border-l-4 transition-all duration-150 bg-neutral-700/25 rounded-lg shadow-md backdrop-blur-sm`};

    &:hover {
        ${tw`shadow-xl border-cyan-500/50`}
    }

    ${({ $status }) =>
        !$status || $status === 'offline'
            ? tw`border-red-500`
            : $status === 'running'
            ? tw`border-green-500`
            : tw`border-yellow-500`};

    &:hover {
        ${({ $status }) =>
            !$status || $status === 'offline'
                ? tw`border-red-400`
                : $status === 'running'
                ? tw`border-green-400`
                : tw`border-yellow-400`};
    }
`;

type Timer = ReturnType<typeof setInterval>;

export default ({ server: initialServer, className }: { server: Server; className?: string }) => {
    const server =
        useStoreState((state: ApplicationStore) =>
            state.servers.data.find((s: Server) => s.uuid === initialServer.uuid)
        ) || initialServer;

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
        // Don't waste a HTTP request if there is nothing important to show to the user because
        // the server is suspended.
        if (isSuspended) return;

        getStats().then(() => {
            interval.current = setInterval(() => getStats(), 5000);
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

    const diskLimit = server.limits.disk !== 0 ? bytesToString(mbToBytes(server.limits.disk)) : '無限制';
    const memoryLimit = server.limits.memory !== 0 ? bytesToString(mbToBytes(server.limits.memory)) : '無限制';
    const cpuLimit = server.limits.cpu !== 0 ? server.limits.cpu + ' %' : '無限制';

    return (
        <StatusIndicatorBox to={`/server/${server.id}`} className={className} $status={server.status || stats?.status}>
            <div css={tw`flex items-center w-full p-4 border-b border-neutral-800/50`}>
                <div css={tw`flex-none w-1/4 flex items-center`}>
                    <div className={'icon mr-4 w-12 h-12 rounded-full bg-neutral-900/50 flex items-center justify-center shadow-md'}>
                        <FontAwesomeIcon icon={faServer} css={tw`text-xl text-neutral-300`} />
                    </div>
                    <div>
                        <p css={tw`text-lg font-semibold break-words`}>{server.name}</p>
                        <p css={tw`text-sm text-neutral-400 break-words line-clamp-2 font-mono`}>
                            {server.allocations
                                .filter((alloc: Allocation) => alloc.isDefault)
                                .map((allocation: Allocation) => (
                                    <React.Fragment key={allocation.ip + allocation.port.toString()}>
                                        {allocation.alias || ip(allocation.ip)}:{allocation.port}
                                    </React.Fragment>
                                ))}
                        </p>
                    </div>
                </div>
                <div css={tw`flex-grow`}/>
                <div css={tw`w-1/4 flex items-center justify-end`}>
                    {!stats || isSuspended ? (
                        isSuspended ? (
                            <div css={tw`text-center`}>
                                <span css={tw`bg-red-600 rounded-full px-3 py-1 text-red-100 text-xs font-semibold uppercase tracking-wider`}>
                                    {server.status === 'suspended' ? '已暫停' : '連線錯誤'}
                                </span>
                            </div>
                        ) : server.isTransferring || server.status ? (
                            <div css={tw`text-center`}>
                                <span css={tw`bg-neutral-600 rounded-full px-3 py-1 text-neutral-100 text-xs font-semibold uppercase tracking-wider`}>
                                    {server.isTransferring
                                        ? '轉移中'
                                        : server.status === 'installing'
                                        ? '安裝中'
                                        : server.status === 'restoring_backup'
                                        ? '還原備份中'
                                        : '不可用'}
                                </span>
                            </div>
                        ) : (
                            <Spinner size={'small'} />
                        )
                    ) : null}
                </div>
            </div>
            {stats && !isSuspended && (
                <div css={tw`w-full px-4 py-3`}>
                    <div css={tw`grid grid-cols-3 gap-6`}>
                        {/* CPU */}
                        <div css={tw`text-center`}>
                            <p css={tw`text-xs text-neutral-300 uppercase`}>處理器</p>
                            <p css={tw`text-sm font-mono text-neutral-100 mb-2`}>{stats.cpuUsagePercent.toFixed(2)}%</p>
                            <div css={tw`w-full bg-neutral-900/50 rounded-full h-1`}>
                                <div css={tw`bg-cyan-500 h-1 rounded-full`} style={{ width: `${stats.cpuUsagePercent}%` }} />
                            </div>
                        </div>
                        {/* Memory */}
                        <div css={tw`text-center`}>
                            <p css={tw`text-xs text-neutral-300 uppercase`}>記憶體</p>
                            <p css={tw`text-sm font-mono text-neutral-100 mb-2`}>{bytesToString(stats.memoryUsageInBytes)}</p>
                            <div css={tw`w-full bg-neutral-900/50 rounded-full h-1`}>
                                <div css={tw`bg-green-500 h-1 rounded-full`} style={{ width: `${(stats.memoryUsageInBytes / (server.limits.memory * 1024 * 1024)) * 100}%` }} />
                            </div>
                        </div>
                        {/* Disk */}
                        <div css={tw`text-center`}>
                            <p css={tw`text-xs text-neutral-300 uppercase`}>磁碟空間</p>
                            <p css={tw`text-sm font-mono text-neutral-100 mb-2`}>{bytesToString(stats.diskUsageInBytes)}</p>
                            <div css={tw`w-full bg-neutral-900/50 rounded-full h-1`}>
                                <div css={tw`bg-yellow-500 h-1 rounded-full`} style={{ width: `${(stats.diskUsageInBytes / (server.limits.disk * 1024 * 1024)) * 100}%` }} />
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </StatusIndicatorBox>
    );
};
