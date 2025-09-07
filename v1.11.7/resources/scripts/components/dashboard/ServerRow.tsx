import React, { memo, useEffect, useRef, useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faEthernet, faHdd, faMemory, faMicrochip, faServer } from '@fortawesome/free-solid-svg-icons';
import { Link } from 'react-router-dom';
import { Server } from '@/api/server/getServer';
import getServerResourceUsage, { ServerPowerState, ServerStats } from '@/api/server/getServerResourceUsage';
import { bytesToString, ip, mbToBytes } from '@/lib/formatters';
import tw, { styled } from 'twin.macro';
import GreyRowBox from '@/components/elements/GreyRowBox';
import Spinner from '@/components/elements/Spinner';
import StatusIndicator from '@/components/elements/StatusIndicator';
import isEqual from 'react-fast-compare';

const Description = styled.p`
    ${tw`text-sm break-words line-clamp-2`}
    color: var(--color-text-muted);
`;

const StatusSpan = styled.span`
    ${tw`rounded px-2 py-1 text-xs`}
`;

const SuspendedSpan = styled(StatusSpan)`
    background-color: var(--color-danger-bg, #ef4444);
    color: var(--color-danger-text, #fef2f2);
`;

const NeutralSpan = styled(StatusSpan)`
    background-color: var(--color-neutral-bg, #737373);
    color: var(--color-neutral-text, #f5f5f5);
`;

const ResourceText = styled.p<{ $alarm: boolean }>`
    ${tw`text-sm ml-2`}
    color: ${(props) => (props.$alarm ? 'var(--color-text)' : 'var(--color-text-muted)')};
`;

const LimitText = styled.p`
    ${tw`text-xs mt-1`}
    color: var(--color-text-muted);
`;

const Icon = styled(FontAwesomeIcon)<{ $alarm: boolean }>`
    color: ${(props) => (props.$alarm ? 'var(--color-danger)' : 'var(--color-icon)')};
`;

const isAlarmState = (current: number, limit: number): boolean => limit > 0 && current / (limit * 1024 * 1024) >= 0.9;

type Timer = ReturnType<typeof setInterval>;

const ServerRow = ({ server, className }: { server: Server; className?: string }) => {
    const interval = useRef<Timer>(null) as React.MutableRefObject<Timer>;
    const [isSuspended, setIsSuspended] = useState(server.status === 'suspended');
    const [stats, setStats] = useState<ServerStats | null>(null);

    const getStats = () =>
        getServerResourceUsage(server.uuid)
            .then((data: ServerStats) => setStats(data))
            .catch((error: any) => console.error(error));

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

    const diskLimit = server.limits.disk !== 0 ? bytesToString(mbToBytes(server.limits.disk)) : '無限制';
    const memoryLimit = server.limits.memory !== 0 ? bytesToString(mbToBytes(server.limits.memory)) : '無限制';
    const cpuLimit = server.limits.cpu !== 0 ? server.limits.cpu + ' %' : '無限制';

    return (
        <GreyRowBox as={Link} to={`/server/${server.id}`} className={className} css={tw`flex justify-between items-center`}>
            {/* Left side */}
            <div css={tw`flex items-center`}>
                <div css={tw`mr-4`}>
                    <FontAwesomeIcon icon={faServer} />
                </div>
                <div>
                    <p css={tw`text-lg break-words`}>{server.name}</p>
                    {!!server.description && <Description>{server.description}</Description>}
                </div>
            </div>

            {/* Right side */}
            <div css={tw`flex items-center`}>
                {!stats || isSuspended ? (
                    <div css={tw`flex items-center`}>
                        {isSuspended ? (
                            <SuspendedSpan>
                                {server.status === 'suspended' ? '已暫停' : '連線錯誤'}
                            </SuspendedSpan>
                        ) : server.isTransferring || server.status ? (
                            <NeutralSpan>
                                {server.isTransferring
                                    ? '轉移中'
                                    : server.status === 'installing'
                                    ? '安裝中'
                                    : server.status === 'restoring_backup'
                                    ? '還原備份中'
                                    : '不可用'}
                            </NeutralSpan>
                        ) : (
                            <Spinner size={'small'} />
                        )}
                        <div css={tw`ml-4`}>
                            <StatusIndicator status={stats?.status} />
                        </div>
                    </div>
                ) : (
                    <div css={tw`flex items-center`}>
                        <div css={tw`text-center`}>
                                <div css={tw`flex items-center justify-center`}>
                                    <Icon icon={faMicrochip} $alarm={alarms.cpu} />
                                    <ResourceText $alarm={alarms.cpu}>{stats.cpuUsagePercent.toFixed(2)} %</ResourceText>
                                </div>
                                <LimitText>/ {cpuLimit}</LimitText>
                            </div>
                            <div css={tw`text-center mx-4`}>
                                <div css={tw`flex items-center justify-center`}>
                                    <Icon icon={faMemory} $alarm={alarms.memory} />
                                    <ResourceText $alarm={alarms.memory}>
                                        {bytesToString(stats.memoryUsageInBytes)}
                                    </ResourceText>
                                </div>
                                <LimitText>/ {memoryLimit}</LimitText>
                            </div>
                            <div css={tw`text-center`}>
                                <div css={tw`flex items-center justify-center`}>
                                    <Icon icon={faHdd} $alarm={alarms.disk} />
                                    <ResourceText $alarm={alarms.disk}>{bytesToString(stats.diskUsageInBytes)}</ResourceText>
                                </div>
                                <LimitText>/ {diskLimit}</LimitText>
                            </div>
                        <div css={tw`ml-4`}>
                            <StatusIndicator status={stats?.status} />
                        </div>
                    </div>
                )}
            </div>
        </GreyRowBox>
    );
};

export default memo(ServerRow, isEqual);
