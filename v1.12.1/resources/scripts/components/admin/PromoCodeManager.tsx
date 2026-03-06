import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { httpErrorToHuman } from '@/api/http';
import useFlash from '@/plugins/useFlash';
import { Button } from '@/components/elements/button/index';
import Input from '@/components/elements/Input';
import Label from '@/components/elements/Label';
import Select from '@/components/elements/Select';
import FlashMessageRender from '@/components/FlashMessageRender';
import tw from 'twin.macro';
import { format } from 'date-fns';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPlus, faTrash } from '@fortawesome/free-solid-svg-icons';
import { useTranslation } from 'react-i18next';

interface Reward {
    type: string;
    amount: number;
}

interface PromoCode {
    rewards?: Reward[];
    type?: string; // Legacy
    amount?: number; // Legacy
    max_uses: number;
    uses: number;
    created_at: number;
}

const PromoCodeManager = () => {
    const { t } = useTranslation();
    const { addFlash, clearFlashes } = useFlash();
    const [codes, setCodes] = useState<Record<string, PromoCode>>({});
    const [loading, setLoading] = useState(true);

    const [newCode, setNewCode] = useState('');
    const [rewards, setRewards] = useState<Reward[]>([{ type: 'points', amount: 100 }]);
    const [newMaxUses, setNewMaxUses] = useState('1');

    const refreshCodes = () => {
        setLoading(true);
        axios.get('/admin/economy/promo_codes')
            .then(({ data }) => setCodes(data || {}))
            .catch(error => console.error(error))
            .finally(() => setLoading(false));
    };

    useEffect(() => {
        refreshCodes();
    }, []);

    const addReward = () => setRewards([...rewards, { type: 'points', amount: 100 }]);
    const removeReward = (index: number) => setRewards(rewards.filter((_, i) => i !== index));
    const updateReward = (index: number, key: keyof Reward, value: any) => {
        const next = [...rewards];
        next[index] = { ...next[index], [key]: key === 'amount' ? Number(value) : value };
        setRewards(next);
    };

    const handleCreate = (e: React.FormEvent) => {
        e.preventDefault();
        clearFlashes('promo:save');
        if (!newCode || rewards.length === 0 || !newMaxUses) return;

        axios.post('/admin/economy/promo_codes', {
            code: newCode,
            rewards,
            max_uses: Number(newMaxUses),
        })
            .then(() => {
                (window as any).swal({
                    title: t('admin.economy.promocodes.success_create_title'),
                    text: t('admin.economy.promocodes.success_create_desc'),
                    type: 'success',
                    confirmButtonText: t('admin.economy.notifications.confirm')
                }, () => {
                    window.location.reload();
                });
                setNewCode('');
                setRewards([{ type: 'points', amount: 100 }]);
            })
            .catch(error => {
                console.error(error);
                (window as any).swal({
                    title: t('admin.economy.promocodes.error_create_title'),
                    text: httpErrorToHuman(error),
                    type: 'error',
                    confirmButtonText: t('admin.economy.notifications.confirm')
                });
            });
    };

    const handleDelete = (code: string) => {
        (window as any).swal({
            title: t('admin.economy.promocodes.confirm_delete_title'),
            text: t('admin.economy.promocodes.confirm_delete_desc', { code }),
            type: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#d9534f',
            confirmButtonText: t('admin.economy.promocodes.confirm_delete_button'),
            cancelButtonText: t('admin.economy.notifications.cancel', { defaultValue: '取消' })
        }, () => {
            clearFlashes('promo:save');
            axios.post('/admin/economy/promo_codes/delete', { code })
                .then(() => {
                    (window as any).swal({
                        title: t('admin.economy.promocodes.success_delete_title'),
                        text: t('admin.economy.promocodes.success_delete_desc'),
                        type: 'success',
                        confirmButtonText: t('admin.economy.notifications.confirm')
                    }, () => {
                        window.location.reload();
                    });
                })
                .catch(error => {
                    console.error(error);
                    (window as any).swal({
                        title: t('admin.economy.promocodes.error_delete_title'),
                        text: httpErrorToHuman(error),
                        type: 'error',
                        confirmButtonText: t('admin.economy.notifications.confirm')
                    });
                });
        });
    };

    return (
        <div style={{ backgroundColor: '#111827', padding: '1.5rem', borderRadius: '1rem', border: '1px solid rgba(255,255,255,0.1)' }}>
            <h2 css={tw`text-xl font-bold mb-4 text-white`}>{t('admin.economy.promocodes.title')}</h2>
            <p css={tw`text-gray-400 mb-6`}>{t('admin.economy.promocodes.description')}</p>


            <form onSubmit={handleCreate} style={{ marginBottom: '2.5rem' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '1.5rem' }}>
                    <div>
                        <Label>{t('admin.economy.promocodes.code_label')}</Label>
                        <Input value={newCode} onChange={e => setNewCode(e.target.value)} placeholder="SUMMER2026" required />
                    </div>
                    <div>
                        <Label>{t('admin.economy.promocodes.max_uses_label')}</Label>
                        <Input type="number" min="1" value={newMaxUses} onChange={e => setNewMaxUses(e.target.value)} required />
                    </div>
                </div>

                <div style={{ marginBottom: '1.5rem' }}>
                    <Label className="mb-2 block">{t('admin.economy.promocodes.reward_title')}</Label>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                        {rewards.map((reward, index) => (
                            <div key={index} style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                                <div style={{ flex: 2 }}>
                                    <Select value={reward.type} onChange={e => updateReward(index, 'type', e.target.value)}>
                                        <option value="points">{t('admin.economy.resources_names.points')}</option>
                                        <option value="cpu">{t('admin.economy.resources_names.cpu')}</option>
                                        <option value="ram">{t('admin.economy.resources_names.ram')}</option>
                                        <option value="disk">{t('admin.economy.resources_names.disk')}</option>
                                        <option value="backups">{t('admin.economy.resources_names.backups')}</option>
                                        <option value="allocations">{t('admin.economy.resources_names.allocations')}</option>
                                        <option value="slots">{t('admin.economy.resources_names.slots')}</option>
                                    </Select>
                                </div>
                                <div style={{ flex: 1 }}>
                                    <Input type="number" step="any" min="0.01" value={reward.amount} onChange={e => updateReward(index, 'amount', e.target.value)} required />
                                </div>
                                {rewards.length > 1 && (
                                    <button
                                        type="button"
                                        onClick={() => removeReward(index)}
                                        style={{ color: '#ef4444', padding: '0.5rem', transition: 'color 0.2s' }}
                                    >
                                        <FontAwesomeIcon icon={faTrash} />
                                    </button>
                                )}
                            </div>
                        ))}
                    </div>
                    <button
                        type="button"
                        onClick={addReward}
                        style={{ marginTop: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#3b82f6', fontSize: '0.875rem', fontWeight: 600 }}
                    >
                        <FontAwesomeIcon icon={faPlus} />
                        {t('admin.economy.promocodes.add_reward')}
                    </button>
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                    <Button type="submit" disabled={!newCode || rewards.length === 0} style={{ padding: '0.75rem 2rem' }}>{t('admin.economy.promocodes.submit')}</Button>
                </div>
            </form>

            <div style={{ borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '1.5rem' }}>
                {loading ? (
                    <p css={tw`text-gray-400`}>{t('global.loading')}</p>
                ) : Object.keys(codes).length === 0 ? (
                    <p css={tw`text-gray-400`}>{t('admin.economy.promocodes.empty')}</p>
                ) : (
                    <table css={tw`w-full text-left`} style={{ borderCollapse: 'collapse' }}>
                        <thead>
                            <tr css={tw`border-b border-gray-700`}>
                                <th css={tw`py-3 px-4 text-gray-400 font-semibold text-sm uppercase`}>{t('admin.economy.promocodes.table_code')}</th>
                                <th css={tw`py-3 px-4 text-gray-400 font-semibold text-sm uppercase`}>{t('admin.economy.promocodes.table_rewards')}</th>
                                <th css={tw`py-3 px-4 text-gray-400 font-semibold text-sm uppercase`}>{t('admin.economy.promocodes.table_uses')}</th>
                                <th css={tw`py-3 px-4 text-gray-400 font-semibold text-sm uppercase`}>{t('admin.economy.promocodes.table_date')}</th>
                                <th css={tw`py-3 px-4 text-gray-400 font-semibold text-sm uppercase text-right`}>{t('admin.economy.promocodes.table_action')}</th>
                            </tr>
                        </thead>
                        <tbody>
                            {Object.entries(codes).map(([code, data]) => {
                                const codeRewards = data.rewards || [{ type: data.type || '?', amount: data.amount || 0 }];
                                return (
                                    <tr key={code} css={tw`border-b border-gray-800 hover:bg-gray-800 transition-colors`}>
                                        <td css={tw`py-4 px-4 font-mono font-bold text-blue-400`}>{code}</td>
                                        <td css={tw`py-4 px-4 text-white text-sm`}>
                                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                                                {codeRewards.map((r, i) => (
                                                    <span key={i}>• {r.amount} {r.type}</span>
                                                ))}
                                            </div>
                                        </td>
                                        <td css={tw`py-4 px-4 text-white`}>{data.uses} / {data.max_uses}</td>
                                        <td css={tw`py-4 px-4 text-gray-400 text-sm`}>{format(new Date(data.created_at * 1000), 'yyyy/MM/dd HH:mm')}</td>
                                        <td css={tw`py-4 px-4 text-right`}>
                                            <Button type="button" variant="secondary" onClick={() => handleDelete(code)} style={{ color: '#ef4444' }}>{t('global.delete')}</Button>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                )}
            </div>
        </div>
    );
};

export default PromoCodeManager;
