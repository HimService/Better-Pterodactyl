import React, { memo, useEffect, useRef, useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faEthernet, faHdd, faMemory, faMicrochip, faServer } from '@fortawesome/free-solid-svg-icons';
import { Link } from 'react-router-dom';
import { Server } from '@/api/server/getServer';
import getServerResourceUsage, { ServerStats } from '@/api/server/getServerResourceUsage';
import { bytesToString, ip, mbToBytes } from '@/lib/formatters';
import tw from 'twin.macro';
import Spinner from '@/components/elements/Spinner';
import StatusIndicator from '@/components/elements/StatusIndicator';
import isEqual from 'react-fast-compare';
import styled from 'styled-components/macro';
import useWebsocketEvent from '@/plugins/useWebsocketEvent';
import { SocketEvent } from '@/components/server/events';
import GreyRowBox from '@/components/elements/GreyRowBox';
import { ServerPowerState } from '@/api/server/getServerResourceUsage';

const StatusIndicatorBox = styled(GreyRowBox)<{ $status: ServerPowerState | undefined }>`
    ${tw`grid grid-cols-12 gap-4 relative`};

    & .status-bar {
        ${tw`w-2 bg-red-500 absolute right-0 z-20 rounded-full m-1 opacity-50 transition-all duration-150`};
        height: calc(100% - 0.5rem);

        ${({ $status }) =>
            !$status || $status === 'offline'
                ? tw`bg-red-500`
                : $status === 'running'
                ? tw`bg-green-500`
                : tw`bg-yellow-500`};
    }

    &:hover .status-bar {
        ${tw`opacity-75`};
    }
`;

const TopSection = styled.div`
    ${tw`flex items-center mb-3`}
`;

const ServerName = styled.p`
    ${tw`text-lg font-semibold text-neutral-200 truncate ml-2`}
`;

const ResourcesSection = styled.div`
    ${tw`flex flex-col space-y-2 mb-3`}
`;

const ResourceRow = styled.div`
    ${tw`flex items-center text-sm`}
`;

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

const ProgressBarContainer = styled.div`
    ${tw`flex-1 h-1.5 mx-4 rounded-full`}
    background-color: #26303c;
`;

const ProgressBar = styled.div`
    ${tw`h-1.5 rounded-full`}
    width: ${(props: { $percent: number }) => props.$percent}%;
    background-color: #5b6a7e;
`;

const ResourceUsage = styled.span`
    ${tw`w-24 text-right font-mono text-neutral-300`}
`;

const ResourceIcon = styled.div`
    ${tw`w-8 text-center text-neutral-400`}
`;

const ResourceLabel = styled.span`
    ${tw`w-16 text-neutral-300`}
`;

const BottomSection = styled.div`
    ${tw`border-t border-gray-800 pt-2 mt-2`}
`;

const ServerIp = styled.p`
    ${tw`text-sm text-neutral-400 font-mono flex items-center`}
`;

type Timer = ReturnType<typeof setInterval>;

const ServerRow = ({ server, className }: { server: Server; className?: string }) => {
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

    useWebsocketEvent(SocketEvent.STATUS, (data: string) => {
        const parsedData = JSON.parse(data);
        if (parsedData.server === server.uuid) {
            setStats((prev) => ({ ...(prev || {}), status: parsedData.status } as ServerStats));
        }
    });

    useWebsocketEvent(SocketEvent.STATS, (data: string) => {
        const parsedData = JSON.parse(data);
        if (parsedData.server === server.uuid) {
            setStats((prev) => ({ ...(prev || {}), ...parsedData.stats } as ServerStats));
        }
    });

    useEffect(() => {
        if (isSuspended) return;

        getStats();

        return () => {
            interval.current && clearInterval(interval.current);
        };
    }, [isSuspended]);

    const cpuPercent = server.limits.cpu > 0 ? ((stats?.cpuUsagePercent || 0) / server.limits.cpu) * 100 : stats?.cpuUsagePercent || 0;
    const memoryPercent = server.limits.memory > 0 ? ((stats?.memoryUsageInBytes || 0) / mbToBytes(server.limits.memory)) * 100 : 0;
    const diskPercent = server.limits.disk > 0 ? ((stats?.diskUsageInBytes || 0) / mbToBytes(server.limits.disk)) * 100 : 0;

    const allocation = server.allocations.find((alloc) => alloc.isDefault);

    return (
        <StatusIndicatorBox className={className} $status={stats?.status}>
            <Link to={`/server/${server.id}`} css={tw`flex items-center col-span-12 sm:col-span-5 lg:col-span-6`}>
                <div className={'icon mr-4'}>
                    <FontAwesomeIcon icon={faServer} />
                </div>
                <div>
                    <p css={tw`text-lg break-words`}>{server.name}</p>
                    {!!server.description && (
                        <p css={tw`text-sm text-neutral-300 break-words line-clamp-2`}>{server.description}</p>
                    )}
                </div>
            </Link>
            <TopSection>
                <StatusIndicator status={stats?.status || (isSuspended ? 'offline' : undefined)} />
                <ServerName>{server.name}</ServerName>
            </TopSection>

            {!stats || isSuspended ? (
                <div css={tw`flex items-center justify-center h-24`}>
                    {isSuspended ? (
                        <p css={tw`text-sm text-neutral-500`}>伺服器已暫停</p>
                    ) : server.isTransferring || server.status ? (
                        <div css={tw`flex-1 text-center`}>
                            <span css={tw`bg-neutral-500 rounded px-2 py-1 text-neutral-100 text-xs`}>
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
                    )}
                </div>
            ) : (
                <ResourcesSection>
                    <ResourceRow>
                        <ResourceIcon>
                            <FontAwesomeIcon icon={faMicrochip} />
                        </ResourceIcon>
                        <ResourceLabel>CPU</ResourceLabel>
                        <ProgressBarContainer>
                            <ProgressBar $percent={cpuPercent} />
                        </ProgressBarContainer>
                        <ResourceUsage>{stats.cpuUsagePercent.toFixed(2)}%</ResourceUsage>
                    </ResourceRow>
                    <ResourceRow>
                        <ResourceIcon>
                            <FontAwesomeIcon icon={faMemory} />
                        </ResourceIcon>
                        <ResourceLabel>記憶體</ResourceLabel>
                        <ProgressBarContainer>
                            <ProgressBar $percent={memoryPercent} />
                        </ProgressBarContainer>
                        <ResourceUsage>{bytesToString(stats.memoryUsageInBytes)}</ResourceUsage>
                    </ResourceRow>
                    <ResourceRow>
                        <ResourceIcon>
                            <FontAwesomeIcon icon={faHdd} />
                        </ResourceIcon>
                        <ResourceLabel>硬碟</ResourceLabel>
                        <ProgressBarContainer>
                            <ProgressBar $percent={diskPercent} />
                        </ProgressBarContainer>
                        <ResourceUsage>{bytesToString(stats.diskUsageInBytes)}</ResourceUsage>
                    </ResourceRow>
                </ResourcesSection>
            )}

            <BottomSection>
                <ServerIp>
                    <FontAwesomeIcon icon={faEthernet} css={tw`mr-2`} />
                    {allocation ? `${ip(allocation.ip)}:${allocation.port}` : 'N/A'}
                </ServerIp>
            </BottomSection>
        </StatusIndicatorBox>
    );
};

export default ServerRow;
