import React, { useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import useFlash from '@/plugins/useFlash';
import Button from '@/components/elements/Button';
import { Dialog } from '@/components/elements/dialog';
import {
    faClock,
    faCloudDownloadAlt,
    faCloudUploadAlt,
    faHdd,
    faMemory,
    faMicrochip,
    faWifi,
    faFileInvoiceDollar,
} from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { bytesToString, ip, mbToBytes } from '@/lib/formatters';
import { ServerContext } from '@/state/server';
import { SocketEvent, SocketRequest } from '@/components/server/events';
import UptimeDuration from '@/components/server/UptimeDuration';
import StatBlock from '@/components/server/console/StatBlock';
import useWebsocketEvent from '@/plugins/useWebsocketEvent';
import classNames from 'classnames';
import { capitalize } from '@/lib/strings';
import { useTranslation } from 'react-i18next';
import styles from './style.module.css';

type Stats = Record<'memory' | 'cpu' | 'disk' | 'uptime' | 'rx' | 'tx', number>;

const getBackgroundColor = (value: number, max: number | null): string | undefined => {
    const delta = !max ? 0 : value / max;

    if (delta > 0.8) {
        if (delta > 0.9) {
            return 'bg-red-500';
        }
        return 'bg-yellow-500';
    }

    return undefined;
};

const Limit = ({ limit, children }: { limit: string | null; children: React.ReactNode }) => (
    <>
        {children}
        <span className={'ml-1 text-neutral-500 dark:text-gray-300 text-[70%] select-none transition-colors duration-300'}>/ {limit || <>&infin;</>}</span>
    </>
);

const ServerDetailsBlock = ({ className }: { className?: string }) => {
    const { t } = useTranslation('frontend');
    const [stats, setStats] = useState<Stats>({ memory: 0, cpu: 0, disk: 0, uptime: 0, tx: 0, rx: 0 });
    const [billing, setBilling] = useState<any>(null);
    const [isRenewing, setIsRenewing] = useState(false);
    const [renewalResult, setRenewalResult] = useState<{ success: boolean; message: string } | null>(null);
    const { addFlash, clearFlashes } = useFlash();

    const status = ServerContext.useStoreState((state) => state.status.value);
    const connected = ServerContext.useStoreState((state) => state.socket.connected);
    const instance = ServerContext.useStoreState((state) => state.socket.instance);
    const limits = ServerContext.useStoreState((state) => state.server.data!.limits);
    const uuid = ServerContext.useStoreState((state) => state.server.data!.uuid);

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

    const fetchBilling = () => {
        if (uuid) {
            axios.get(`/api/client/servers/${uuid}/billing`)
                .then(res => setBilling(res.data))
                .catch(() => { });
        }
    };

    useEffect(() => {
        fetchBilling();

        if (!connected || !instance) {
            return;
        }

        instance.send(SocketRequest.SEND_STATS);
    }, [instance, connected, uuid]);

    const doRenew = () => {
        if (isRenewing) return;
        setIsRenewing(true);
        clearFlashes('server:billing');

        axios.post(`/api/client/servers/${uuid}/billing/renew`)
            .then(() => {
                fetchBilling();
                addFlash({ type: 'success', key: 'server:billing', message: '續費成功！' });
                setRenewalResult({ success: true, message: '成功為伺服器續繳費用！' });
            })
            .catch((error) => {
                const rawMsg = error.response?.data?.error;
                let msg = '續費失敗，請確認您的餘額或稍後再試。';

                if (rawMsg === 'Insufficient balance') {
                    msg = t('economy.insufficient_balance', '餘額不足，請先儲值。');
                } else if (rawMsg === 'Server not linked to billing') {
                    msg = t('economy.not_linked_billing', '此伺服器尚未連結計費。');
                } else if (rawMsg) {
                    msg = rawMsg;
                }

                addFlash({
                    type: 'error',
                    key: 'server:billing',
                    message: msg
                });
                setRenewalResult({ success: false, message: msg });
            })
            .finally(() => {
                setIsRenewing(false);
            });
    };

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

    return (
        <div className={classNames('grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2 md:gap-4', className)}>
            <StatBlock icon={faWifi} title={t('server.console.address', '位址')} copyOnClick={allocation}>
                {allocation}
            </StatBlock>
            <StatBlock
                icon={faClock}
                title={t('server.console.uptime', '運行時間')}
                color={getBackgroundColor(status === 'running' ? 0 : status !== 'offline' ? 9 : 10, 10)}
            >
                {status === null ? (
                    t('server.console.offline', '離線')
                ) : stats.uptime > 0 ? (
                    <UptimeDuration uptime={stats.uptime / 1000} />
                ) : status === 'offline' ? (
                    '離線'
                ) : status === 'starting' ? (
                    '啟動中'
                ) : status === 'stopping' ? (
                    '停止中'
                ) : (
                    capitalize(status)
                )}
            </StatBlock>
            <StatBlock icon={faMicrochip} title={t('server.console.cpu_load', '處理器使用量')} color={getBackgroundColor(stats.cpu, limits.cpu)}>
                {status === 'offline' ? (
                    <span className={'text-neutral-500 dark:text-gray-400 transition-colors duration-300'}>{t('server.console.offline', '離線')}</span>
                ) : (
                    <Limit limit={textLimits.cpu}>{stats.cpu.toFixed(2)}%</Limit>
                )}
            </StatBlock>
            <StatBlock
                icon={faMemory}
                title={t('server.console.memory', '記憶體')}
                color={getBackgroundColor(stats.memory / 1024, limits.memory * 1024)}
            >
                {status === 'offline' ? (
                    <span className={'text-neutral-500 dark:text-gray-400 transition-colors duration-300'}>{t('server.console.offline', '離線')}</span>
                ) : (
                    <Limit limit={textLimits.memory}>{bytesToString(stats.memory)}</Limit>
                )}
            </StatBlock>
            <StatBlock icon={faHdd} title={t('server.console.disk', '硬碟')} color={getBackgroundColor(stats.disk / 1024, limits.disk * 1024)}>
                <Limit limit={textLimits.disk}>{bytesToString(stats.disk)}</Limit>
            </StatBlock>
            <StatBlock icon={faCloudDownloadAlt} title={t('server.console.network_inbound', '網路 (輸入)')}>
                {status === 'offline' ? <span className={'text-gray-400'}>{t('server.console.offline', '離線')}</span> : bytesToString(stats.rx)}
            </StatBlock>
            <StatBlock icon={faCloudUploadAlt} title={t('server.console.network_outbound', '網路 (輸出)')}>
                {status === 'offline' ? <span className={'text-gray-400'}>{t('server.console.offline', '離線')}</span> : bytesToString(stats.tx)}
            </StatBlock>
            {billing?.enabled && billing?.billing && (
                <div className={classNames(
                    styles.stat_block,
                    'bg-white/80 dark:bg-[#0a0a0c]/80 backdrop-blur-xl border border-black/10 dark:border-white/5 shadow-xl transition-all duration-300 hover:bg-white dark:hover:bg-[#121215]/90 hover:shadow-2xl hover:border-black/20 dark:hover:border-white/10 group'
                )}>
                    <div className={classNames(styles.status_bar, billing.billing.status === 'overdue' ? 'bg-red-500' : billing.billing.status === 'suspended' ? 'bg-orange-500' : 'bg-neutral-400 dark:bg-gray-600')} />
                    <div className={classNames(
                        styles.icon,
                        billing.billing.status === 'overdue' || billing.billing.status === 'suspended'
                            ? (billing.billing.status === 'overdue' ? 'from-red-400 to-red-600' : 'from-orange-400 to-orange-600') + ' bg-gradient-to-br border border-white/10'
                            : 'bg-gradient-to-br from-neutral-200 to-neutral-300 dark:from-gray-700 dark:to-gray-800 border border-black/5 dark:border-white/5 box-border'
                    )}>
                        <FontAwesomeIcon icon={faFileInvoiceDollar} className={classNames('w-5 h-5 mx-auto drop-shadow-md', billing.billing.status === 'overdue' || billing.billing.status === 'suspended' ? 'text-white' : 'text-neutral-500 dark:text-gray-300')} />
                    </div>

                    <div className="flex flex-col justify-start overflow-hidden w-full relative z-10 py-1">
                        <p className={'font-header font-semibold tracking-wide leading-tight text-[11px] md:text-xs text-neutral-500 uppercase'}>計費資訊</p>
                        <div className="flex flex-col gap-1.5 mt-1 w-full relative z-10">
                            <div className="flex flex-col min-w-0">
                                <span className="text-sm font-semibold truncate text-neutral-800 dark:text-gray-50" title={new Date(billing.billing.next_billing_at).toLocaleString()}>
                                    {billing.billing.next_billing_at ? new Date(billing.billing.next_billing_at).toLocaleString('zh-TW', { month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' }) : '尚未開始'}
                                </span>
                                <span className="text-[11px] text-gray-400 font-medium truncate uppercase mt-0.5">
                                    {billing.billing.status} | {billing.billing.price} 點 / {
                                        billing.billing.billing_cycle === 'hourly' ? '小時' :
                                            billing.billing.billing_cycle === 'daily' ? '天' :
                                                billing.billing.billing_cycle === 'weekly' ? '週' :
                                                    billing.billing.billing_cycle === 'monthly' ? '月' : billing.billing.billing_cycle
                                    }
                                </span>
                            </div>
                            <Button size={'xsmall'} onClick={doRenew} disabled={isRenewing} className={'w-full mt-1 px-2 py-1.5'}>
                                {isRenewing ? '處理中...' : '手動續繳'}
                            </Button>
                        </div>
                    </div>
                </div>
            )}

            <Dialog
                open={!!renewalResult}
                onClose={() => setRenewalResult(null)}
                title={renewalResult?.success ? '續費成功' : '續費失敗'}
            >
                <div className={'pb-4 text-gray-200'}>
                    <p>{renewalResult?.message}</p>
                </div>
                <Dialog.Footer>
                    <Button onClick={() => setRenewalResult(null)}>確認</Button>
                </Dialog.Footer>
            </Dialog>
        </div>
    );
};

export default ServerDetailsBlock;
