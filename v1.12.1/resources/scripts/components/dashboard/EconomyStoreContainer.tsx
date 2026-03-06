import React, { useEffect, useState } from 'react';
import { useStoreActions } from 'easy-peasy';
import { Action, Actions } from 'easy-peasy';
import { ApplicationStore } from '@/state';
import { useTranslation } from 'react-i18next';
import useFlash from '@/plugins/useFlash';
import { httpErrorToHuman } from '@/api/http';
import axios from 'axios';
import Spinner from '@/components/elements/Spinner';
import ContentBox from '@/components/elements/ContentBox';
import styled from 'styled-components';
import { Button } from '@/components/elements/button';
import { Dialog } from '@/components/elements/dialog';
import Input from '@/components/elements/Input';
import FlashMessageRender from '@/components/FlashMessageRender';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCoins, faMemory, faMicrochip, faHdd, faFileArchive, faNetworkWired, faLayerGroup, faServer, faListAlt, faArrowUp, faArrowDown } from '@fortawesome/free-solid-svg-icons';
import { NavLink } from 'react-router-dom';
import { formatMB } from '@/helpers';

const ResourceCard = styled.div`
    background: linear-gradient(145deg, #1f2937, #111827);
    border: 1px solid rgba(255, 255, 255, 0.05);
    border-radius: 1.25rem;
    padding: 1.75rem;
    display: flex;
    flex-direction: column;
    gap: 1.25rem;
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);

    &:hover {
        border-color: rgba(59, 130, 246, 0.5);
        transform: translateY(-4px);
        box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.2), 0 10px 10px -5px rgba(0, 0, 0, 0.1);
    }
`;

const IconWrapper = styled.div`
    width: 3rem;
    height: 3rem;
    background-color: rgba(59, 130, 246, 0.1);
    border-radius: 0.75rem;
    display: flex;
    align-items: center;
    justify-content: center;
    color: #3b82f6;
`;

interface BundleItem {
    amount: number;
    price: number;
}

interface EconomyData {
    points: number;
    settings: {
        enabled: boolean;
        bundles: {
            cpu: BundleItem;
            ram: BundleItem;
            disk: BundleItem;
            backups: BundleItem;
            allocations: BundleItem;
            slots: BundleItem;
        };
    };
}

const EconomyStoreContainer = () => {
    const { t } = useTranslation('translation');
    const { addFlash, clearFlashes } = useFlash();
    const [loading, setLoading] = useState(true);
    const [data, setData] = useState<EconomyData | null>(null);
    const [purchaseModal, setPurchaseModal] = useState<{ type: keyof EconomyData['settings']['bundles']; price: number; amount: number; title: string; unit: string } | null>(null);
    const [purchasing, setPurchasing] = useState(false);
    const [promoCode, setPromoCode] = useState('');
    const [redeeming, setRedeeming] = useState(false);
    const [history, setHistory] = useState<any[]>([]);
    const refreshPoints = useStoreActions((actions: Actions<ApplicationStore>) => actions.user.refreshPoints);

    const refreshData = () => {
        axios.get('/api/client/economy')
            .then(({ data }) => {
                setData(data);
                refreshPoints(); // Sync global state
                return axios.get('/api/client/economy/history');
            })
            .then(res => {
                if (res?.data?.history) {
                    setHistory(res.data.history);
                }
            })
            .catch(error => {
                console.error(error);
                addFlash({ type: 'error', message: httpErrorToHuman(error), key: 'economy:load' });
            })
            .finally(() => setLoading(false));
    };

    useEffect(() => {
        refreshData();
    }, []);

    const confirmPurchase = () => {
        if (!purchaseModal) return;
        setPurchasing(true);
        clearFlashes('economy:purchase');

        axios.post('/api/client/economy/purchase', {
            resource: purchaseModal.type,
            amount: 1, // Purchase 1 unit by default
        })
            .then(() => {
                addFlash({ type: 'success', message: t('economy.purchase_success'), key: 'economy:purchase' });
                refreshData();
                setPurchaseModal(null);
            })
            .catch(error => {
                console.error(error);
                addFlash({ type: 'error', message: httpErrorToHuman(error), key: 'economy:purchase' });
            })
            .finally(() => setPurchasing(false));
    };

    const redeemCode = (e: React.FormEvent) => {
        e.preventDefault();
        if (!promoCode) return;
        setRedeeming(true);
        clearFlashes('economy:redeem');

        axios.post('/api/client/economy/redeem', { code: promoCode })
            .then(({ data }) => {
                addFlash({ type: 'success', message: t('economy.redeem_success', { amount: data.reward_amount, type: t(`economy.resources.${data.reward_type}`, data.reward_type) }), key: 'economy:redeem' });
                setPromoCode('');
                refreshData();
            })
            .catch(error => {
                console.error(error);
                addFlash({ type: 'error', message: httpErrorToHuman(error), key: 'economy:redeem' });
            })
            .finally(() => setRedeeming(false));
    };

    if (loading || !data) {
        return <Spinner centered />;
    }

    if (!data.settings.enabled) {
        return (
            <ContentBox title={t('economy.store')}>
                <p className={'text-gray-400 text-center py-8'}>{t('economy.disabled')}</p>
            </ContentBox>
        );
    }

    type ResourceType = keyof EconomyData['settings']['bundles'];
    const resources: { type: ResourceType; icon: any; unit: string }[] = [
        { type: 'cpu', icon: faMicrochip, unit: '%' },
        { type: 'ram', icon: faMemory, unit: 'MB' },
        { type: 'disk', icon: faHdd, unit: 'MB' },
        { type: 'backups', icon: faFileArchive, unit: 'slot' },
        { type: 'allocations', icon: faNetworkWired, unit: 'slot' },
        { type: 'slots', icon: faLayerGroup, unit: 'slot' },
    ];

    return (
        <ContentBox title={t('economy.store')} showLoadingOverlay={loading}>
            <div className={'flex items-center justify-between mb-8 bg-gradient-to-r from-gray-800 to-gray-900 p-6 rounded-2xl shadow-lg border border-gray-700/50 relative overflow-hidden'}>
                <div className="absolute top-0 right-0 -mr-8 -mt-8 w-32 h-32 bg-blue-500/10 rounded-full blur-2xl"></div>
                <div className={'flex items-center gap-4 relative z-10'}>
                    <div className={'p-3 bg-yellow-400/10 rounded-xl'}>
                        <FontAwesomeIcon icon={faCoins} className={'text-yellow-400 text-3xl drop-shadow-lg'} />
                    </div>
                    <div>
                        <p className={'text-gray-400 text-sm font-medium uppercase tracking-wider'}>{t('economy.balance')}</p>
                        <span className={'text-3xl font-bold text-white tracking-tight'}>{data.points}</span>
                    </div>
                </div>
                <NavLink to={'/economy/create'} className={'relative z-10'}>
                    <Button className={'px-6 py-3 rounded-xl shadow-lg shadow-blue-500/30 hover:shadow-blue-500/50 hover:-translate-y-0.5 transition-all text-sm font-bold tracking-wide'}>
                        <FontAwesomeIcon icon={faServer} className={'mr-2'} /> {t('economy.create_server.title')}
                    </Button>
                </NavLink>
            </div>

            <div className={'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'}>
                {resources.map(res => {
                    const bundle = data.settings.bundles[res.type] || { amount: 0, price: 0 };
                    return (
                        <ResourceCard key={res.type}>
                            <div className={'flex items-center gap-4'}>
                                <IconWrapper className={'shadow-inner'}>
                                    <FontAwesomeIcon icon={res.icon} size={'lg'} />
                                </IconWrapper>
                                <div>
                                    <h3 className={'font-bold text-lg text-gray-100 flex items-center gap-2'}>
                                        {t(`economy.resources.${res.type}`)}
                                        <span className={'text-xs px-2 py-0.5 bg-blue-500/10 text-blue-400 rounded-full font-semibold border border-blue-500/20'}>
                                            +{res.type === 'ram' || res.type === 'disk' ? formatMB(bundle.amount) : `${bundle.amount}${res.unit}`}
                                        </span>
                                    </h3>
                                    <p className={'text-gray-400 text-sm mt-1'}>
                                        <span className={'font-semibold text-gray-300'}>{bundle.price}</span> {t('economy.points')}
                                    </p>
                                </div>
                            </div>
                            <Button
                                className={'w-full mt-auto py-3 rounded-xl hover:shadow-lg transition-all text-sm font-bold tracking-wide'}
                                onClick={() => setPurchaseModal({ type: res.type, price: bundle.price, amount: bundle.amount, title: t(`economy.resources.${res.type}`), unit: res.unit })}
                                disabled={data.points < bundle.price}
                            >
                                {t('economy.buy')}
                            </Button>
                        </ResourceCard>
                    );
                })}
            </div>

            <div className={'mt-10 p-8 bg-gradient-to-br from-gray-800 to-gray-900 rounded-2xl shadow-xl border border-gray-700/50'}>
                <h3 className={'font-bold text-xl mb-6 text-white flex items-center gap-3'}>
                    <div className={'w-8 h-8 rounded-lg bg-indigo-500/20 flex items-center justify-center'}>
                        <FontAwesomeIcon icon={faCoins} className={'text-indigo-400'} />
                    </div>
                    {t('economy.redeem_code_title')}
                </h3>
                <form onSubmit={redeemCode} className={'flex flex-col sm:flex-row gap-4'}>
                    <Input
                        value={promoCode}
                        onChange={e => setPromoCode(e.target.value)}
                        placeholder={t('economy.enter_code')}
                        className={'flex-1 bg-gray-900/50 border-gray-700 focus:border-indigo-500 rounded-xl px-4 py-3'}
                    />
                    <Button type={'submit'} disabled={redeeming || !promoCode} className={'px-8 py-3 rounded-xl hover:shadow-lg hover:shadow-indigo-500/20 transition-all font-bold tracking-wide whitespace-nowrap'}>
                        {redeeming ? t('economy.redeeming') : t('economy.redeem')}
                    </Button>
                </form>
                <div className={'mt-4'}>
                    <FlashMessageRender byKey={'economy:redeem'} />
                </div>
            </div>

            <div className={'mt-10 p-8 bg-gradient-to-br from-gray-800 to-gray-900 rounded-2xl shadow-xl border border-gray-700/50'}>
                <h3 className={'font-bold text-xl mb-6 text-white flex items-center gap-3'}>
                    <div className={'w-8 h-8 rounded-lg bg-green-500/20 flex items-center justify-center'}>
                        <FontAwesomeIcon icon={faListAlt} className={'text-green-400'} />
                    </div>
                    {t('economy.transaction_history')}
                </h3>

                {history.length === 0 ? (
                    <p className={'text-gray-400 text-center py-6'}>{t('economy.no_history')}</p>
                ) : (
                    <div className={'overflow-x-auto rounded-xl border border-gray-700/50'}>
                        <table className={'w-full text-left border-collapse'}>
                            <thead className={'bg-gray-800/80 text-gray-300 text-xs uppercase tracking-wider'}>
                                <tr>
                                    <th className={'px-6 py-4 font-semibold'}>{t('economy.history_date', '日期')}</th>
                                    <th className={'px-6 py-4 font-semibold'}>{t('economy.history_type', '類型')}</th>
                                    <th className={'px-6 py-4 font-semibold text-right'}>{t('economy.history_amount', '金額')}</th>
                                </tr>
                            </thead>
                            <tbody className={'divide-y divide-gray-700/50'}>
                                {history.map((record) => {
                                    const isPositive = record.amount > 0;
                                    const typeFallback: Record<string, string> = {
                                        'charge_success': '伺服器扣款',
                                        'charge_failed': '扣款失敗',
                                        'purchase_resource': '購買資源',
                                        'redeem_code': '兌換序號',
                                        'auto_renew': '自動續費'
                                    };
                                    return (
                                        <tr key={record.id} className={'hover:bg-white/[0.02] transition-colors'}>
                                            <td className={'px-6 py-4 text-sm text-gray-400 whitespace-nowrap'}>
                                                {record.created_at}
                                            </td>
                                            <td className={'px-6 py-4'}>
                                                <div className={'flex flex-col'}>
                                                    <span className={'text-sm font-medium text-gray-200'}>
                                                        {t(`economy.history_types.${record.type}`, typeFallback[record.type] || record.type)}
                                                    </span>
                                                    {record.metadata?.server_id && (
                                                        <span className={'text-xs text-gray-500 mt-1 uppercase'}>
                                                            {record.group === 'billing' ? `Server ID: ${record.metadata.server_id}` : ''}
                                                        </span>
                                                    )}
                                                </div>
                                            </td>
                                            <td className={'px-6 py-4 text-right whitespace-nowrap'}>
                                                <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-bold ${isPositive
                                                    ? 'bg-green-500/10 text-green-400 border border-green-500/20'
                                                    : 'bg-red-500/10 text-red-400 border border-red-500/20'
                                                    }`}>
                                                    <FontAwesomeIcon icon={isPositive ? faArrowUp : faArrowDown} className={'text-xs'} />
                                                    {Math.abs(record.amount).toFixed(2)}
                                                </span>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            <Dialog
                open={!!purchaseModal}
                onClose={() => setPurchaseModal(null)}
                title={t('economy.purchase')}
                description={t('economy.purchase_desc', { amount: purchaseModal?.amount, unit: purchaseModal?.unit, title: purchaseModal?.title, price: purchaseModal?.price })}
            >
                <div className={'flex justify-end gap-3 mt-4'}>
                    <Button variant={'secondary'} onClick={() => setPurchaseModal(null)}>{t('global.cancel')}</Button>
                    <Button onClick={confirmPurchase} disabled={purchasing}>{t('economy.buy')}</Button>
                </div>
            </Dialog>
        </ContentBox>
    );
};

export default EconomyStoreContainer;
