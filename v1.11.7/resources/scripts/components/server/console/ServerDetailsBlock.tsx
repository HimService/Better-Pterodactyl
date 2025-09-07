import React, { useEffect, useMemo, useState } from 'react';
import { bytesToString, ip, mbToBytes } from '@/lib/formatters';
import { ServerContext } from '@/state/server';
import { SocketEvent, SocketRequest } from '@/components/server/events';
import UptimeDuration from '@/components/server/UptimeDuration';
import useWebsocketEvent from '@/plugins/useWebsocketEvent';
import GreyRowBox from '@/components/elements/GreyRowBox';
import StatusIndicator from '@/components/elements/StatusIndicator';

type Stats = Record<'memory' | 'cpu' | 'disk' | 'uptime' | 'rx' | 'tx', number>;

const Limit = ({ limit, children }: { limit: string | null; children: React.ReactNode }) => (
    <>
        {children}
        <span className={'ml-1 text-gray-300 text-[70%] select-none'}>/ {limit || <>&infin;</>}</span>
    </>
);

const ServerDetailsBlock = ({ className }: { className?: string }) => {
    const [stats, setStats] = useState<Stats>({ memory: 0, cpu: 0, disk: 0, uptime: 0, tx: 0, rx: 0 });

    const status = ServerContext.useStoreState((state) => state.status.value);
    const connected = ServerContext.useStoreState((state) => state.socket.connected);
    const instance = ServerContext.useStoreState((state) => state.socket.instance);
    const limits = ServerContext.useStoreState((state) => state.server.data!.limits);

    const textLimits = useMemo(
        () => ({
            cpu: limits?.cpu ? `${limits.cpu}%` : null,
            memory: limits?.memory ? bytesToString(mbToBytes(limits.memory)) : null,
            disk: limits?.disk ? bytesToString(mbToBytes(limits.disk)) : null,
        }),
        [limits]
    );

    const allocation = ServerContext.useStoreState((state) => {
        const match = state.server.data!.allocations.find((allocation) => allocation.isDefault);
        return !match ? 'n/a' : `${match.alias || ip(match.ip)}:${match.port}`;
    });

    useEffect(() => {
        if (!connected || !instance) {
            return;
        }
        instance.send(SocketRequest.SEND_STATS);
    }, [instance, connected]);

    useWebsocketEvent(SocketEvent.STATS, (data) => {
        let stats: any = {};
        try {
            stats = JSON.parse(data);
        } catch (e) {
            return;
        }
        setStats({
            memory: stats.memory_bytes,
            cpu: stats.cpu_absolute,
            disk: stats.disk_bytes,
            tx: stats.network.tx_bytes,
            rx: stats.network.rx_bytes,
            uptime: stats.uptime || 0,
        });
    });

    const statusToColor = (): 'red' | 'yellow' | 'green' | 'neutral' => {
        switch (status) {
            case 'starting':
                return 'yellow';
            case 'stopping':
                return 'red';
            case 'running':
                return 'green';
            default:
                return 'neutral';
        }
    };

    return (
        <div className={className}>
            <GreyRowBox icon={undefined} title={'連線位址'} copyOnClick={allocation}>
                {allocation}
            </GreyRowBox>
            <GreyRowBox
                icon={<StatusIndicator status={status} />}
                title={'狀態'}
            >
                {status === null ? (
                    '離線'
                ) : stats.uptime > 0 ? (
                    <UptimeDuration uptime={stats.uptime / 1000} />
                ) : (
                    {
                        running: '運行中',
                        starting: '啟動中',
                        stopping: '停止中',
                        offline: '離線',
                    }[status] || '未知狀態'
                )}
            </GreyRowBox>
            <GreyRowBox icon={undefined} title={'CPU 負載'}>
                {status === 'offline' ? (
                    <span className={'text-gray-400'}>離線</span>
                ) : (
                    <Limit limit={textLimits.cpu}>{stats.cpu.toFixed(2)}%</Limit>
                )}
            </GreyRowBox>
            <GreyRowBox icon={undefined} title={'記憶體'}>
                {status === 'offline' ? (
                    <span className={'text-gray-400'}>離線</span>
                ) : (
                    <Limit limit={textLimits.memory}>{bytesToString(stats.memory)}</Limit>
                )}
            </GreyRowBox>
            <GreyRowBox icon={undefined} title={'儲存空間'}>
                <Limit limit={textLimits.disk}>{bytesToString(stats.disk)}</Limit>
            </GreyRowBox>
            <GreyRowBox icon={undefined} title={'網路 (上傳)'}>
                {status === 'offline' ? <span className={'text-gray-400'}>離線</span> : bytesToString(stats.rx)}
            </GreyRowBox>
            <GreyRowBox icon={undefined} title={'網路 (下載)'}>
                {status === 'offline' ? <span className={'text-gray-400'}>離線</span> : bytesToString(stats.tx)}
            </GreyRowBox>
        </div>
    );
};

export default ServerDetailsBlock;
