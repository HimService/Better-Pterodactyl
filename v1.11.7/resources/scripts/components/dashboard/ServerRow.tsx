import React, { memo, useEffect, useRef, useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faEthernet, faHdd, faMemory, faMicrochip, faServer } from '@fortawesome/free-solid-svg-icons';
import { Link } from 'react-router-dom';
import { Server } from '../../../api/server/getServer';
import getServerResourceUsage, { ServerPowerState, ServerStats } from '../../../api/server/getServerResourceUsage';
import { bytesToString, ip, mbToBytes } from '../../../lib/formatters';
import tw from 'twin.macro';
import GreyRowBox from '../../elements/GreyRowBox';
import Spinner from '../../elements/Spinner';
import StatusIndicator from '../../elements/StatusIndicator';
import isEqual from 'react-fast-compare';

const isAlarmState = (current: number, limit: number): boolean => limit > 0 && current / (limit * 1024 * 1024) >= 0.9;

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
        <GreyRowBox as={Link} to={`/server/${server.id}`} className={className}>
            <div css={tw`flex items-center`}>
                <div css={tw`mr-4`}>
                    <FontAwesomeIcon icon={faServer} />
                </div>
                <div css={tw`flex-1`}>
                    <p css={tw`text-lg break-words`}>{server.name}</p>
                    {!!server.description && (
                        <p css={tw`text-sm text-neutral-300 break-words line-clamp-2`}>{server.description}</p>
                    )}
                </div>
            </div>
            <div css={tw`flex-none self-center ml-4`}>
                <StatusIndicator status={stats?.status} />
            </div>
            <div css={tw`ml-auto flex items-center`}>
                {!stats || isSuspended ? (
                    isSuspended ? (
                        <div css={tw`text-right`}>
                            <span css={tw`bg-red-500 rounded px-2 py-1 text-red-100 text-xs`}>
                                {server.status === 'suspended' ? '已暫停' : '連線錯誤'}
                            </span>
                        </div>
                    ) : server.isTransferring || server.status ? (
                        <div css={tw`text-right`}>
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
                    )
                ) : (
                    <>
                        <div css={tw`text-center`}>
                            <div css={tw`flex items-center justify-center`}>
                                <FontAwesomeIcon icon={faMicrochip} css={alarms.cpu ? tw`text-red-400` : tw`text-neutral-500`} />
                                <p css={[tw`text-sm ml-2`, alarms.cpu ? tw`text-white` : tw`text-neutral-400`]}>
                                    {stats.cpuUsagePercent.toFixed(2)} %
                                </p>
                            </div>
                            <p css={tw`text-xs text-neutral-600 mt-1`}>/ {cpuLimit}</p>
                        </div>
                        <div css={tw`text-center mx-4`}>
                            <div css={tw`flex items-center justify-center`}>
                                <FontAwesomeIcon icon={faMemory} css={alarms.memory ? tw`text-red-400` : tw`text-neutral-500`} />
                                <p css={[tw`text-sm ml-2`, alarms.memory ? tw`text-white` : tw`text-neutral-400`]}>
                                    {bytesToString(stats.memoryUsageInBytes)}
                                </p>
                            </div>
                            <p css={tw`text-xs text-neutral-600 mt-1`}>/ {memoryLimit}</p>
                        </div>
                        <div css={tw`text-center`}>
                            <div css={tw`flex items-center justify-center`}>
                                <FontAwesomeIcon icon={faHdd} css={alarms.disk ? tw`text-red-400` : tw`text-neutral-500`} />
                                <p css={[tw`text-sm ml-2`, alarms.disk ? tw`text-white` : tw`text-neutral-400`]}>
                                    {bytesToString(stats.diskUsageInBytes)}
                                </p>
                            </div>
                            <p css={tw`text-xs text-neutral-600 mt-1`}>/ {diskLimit}</p>
                        </div>
                    </>
                )}
            </div>
        </GreyRowBox>
    );
};

export default memo(ServerRow, isEqual);
