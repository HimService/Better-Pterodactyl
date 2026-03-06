import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Field, Form, Formik, FormikHelpers } from 'formik';
import Switch from '@/components/elements/Switch';
import useFlash from '@/plugins/useFlash';
import FlashMessageRender from '@/components/FlashMessageRender';
import { httpErrorToHuman } from '@/api/http';
import http from '@/api/http';
import Spinner from '@/components/elements/Spinner';
import styled from 'styled-components';
import tw from 'twin.macro';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCoins, faSave, faCogs, faGem, faShoppingCart, faTicketAlt, faUsers, faKey, faServer } from '@fortawesome/free-solid-svg-icons';
import PromoCodeManager from './PromoCodeManager';

const Container = styled.div`
    ${tw`max-w-7xl mx-auto my-8`};
`;

const Card = styled.div`
    background-color: #111827;
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: 1rem;
    padding: 2rem;
    box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.5);
    margin-bottom: 2rem;
`;

const NavContainer = styled.div`
    ${tw`flex gap-2 mb-8 border-b border-gray-700 pb-2 overflow-x-auto`};
`;

const NavItem = styled.button<{ active?: boolean }>`
    ${tw`px-4 py-2 rounded-lg font-semibold transition-all flex items-center gap-2 whitespace-nowrap`};
    ${props => props.active
        ? tw`bg-blue-600 text-white shadow-lg`
        : tw`text-gray-400 hover:text-white hover:bg-gray-800`};
`;

const Label = styled.label`
    display: block;
    color: #9ca3af;
    font-size: 0.75rem;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.1em;
    margin-bottom: 0.5rem;
`;

const Input = styled.input`
    width: 100%;
    background-color: rgba(255, 255, 255, 0.05);
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: 0.75rem;
    padding: 0.75rem 1rem;
    color: white;
    outline: none;
    transition: all 0.2s;
    &:focus { border-color: #3b82f6; }
`;

const Button = styled.button<{ variant?: 'secondary' | 'danger' }>`
    ${tw`px-6 py-2 rounded-xl font-bold transition-all flex items-center justify-center gap-2`};
    ${props => props.variant === 'secondary'
        ? tw`bg-gray-700 text-white hover:bg-gray-600`
        : props.variant === 'danger'
            ? tw`bg-red-600 text-white hover:bg-red-500`
            : tw`bg-blue-600 text-white hover:bg-blue-500 shadow-lg`
    };
    &:disabled { ${tw`opacity-50 cursor-not-allowed`} }
`;

interface BundleItem {
    amount: number;
    price: number;
}

interface Bundles {
    cpu: BundleItem;
    ram: BundleItem;
    disk: BundleItem;
    backups: BundleItem;
    allocations: BundleItem;
    slots: BundleItem;
}

interface Defaults {
    points: number;
    cpu: number;
    ram: number;
    disk: number;
    backups: number;
    allocations: number;
    slots: number;
}

interface MinLimits {
    cpu: number;
    ram: number;
    disk: number;
}

interface ApiToken {
    id: string;
    name: string;
    token: string;
    created_at: number;
}

interface EconomySettings {
    enabled: boolean;
    bundles: Bundles;
    defaults: Defaults;
    min_limits: MinLimits;
    api_tokens: ApiToken[];
    allowed_eggs: number[];
    allowed_nodes: number[];
    billing: {
        enabled: boolean;
        base_price: number;
        cpu_coeff: number;
        ram_coeff: number;
        disk_coeff: number;
        grace_period_hours: number;
        pending_delete_days: number;
        webhook_url: string;
    };
}


const UserResourceEditor = () => {
    const { t } = useTranslation();
    const { addFlash, clearFlashes } = useFlash();
    const [search, setSearch] = useState('');
    const [users, setUsers] = useState<any[]>([]);
    const [editing, setEditing] = useState<number | null>(null);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (search.length < 3) {
            setUsers([]);
            return;
        }

        const handler = setTimeout(() => {
            setLoading(true);
            http.get(`/admin/economy/users?filter=${search}`)
                .then(({ data }) => setUsers(data))
                .catch(console.error)
                .finally(() => setLoading(false));
        }, 500);

        return () => clearTimeout(handler);
    }, [search]);

    const saveUser = (userId: number, values: any, { setSubmitting }: FormikHelpers<any>) => {
        clearFlashes('economy:user-save');
        http.post(`/admin/economy/users/${userId}/resources`, values)
            .then(() => {
                (window as any).swal({
                    title: t('admin.economy.users.save_success'),
                    text: t('admin.economy.users.save_success_desc'),
                    type: 'success',
                    confirmButtonText: t('admin.economy.notifications.confirm')
                }, () => {
                    window.location.reload();
                });
                setEditing(null);
            })
            .catch(error => {
                (window as any).swal({
                    title: t('admin.economy.users.save_error'),
                    text: httpErrorToHuman(error),
                    type: 'error',
                    confirmButtonText: t('admin.economy.notifications.confirm')
                });
            })
            .finally(() => {
                setSubmitting(false);
            });
    };

    return (
        <Card>
            <h3 style={{ color: 'white', fontSize: '1.25rem', fontWeight: 700, marginBottom: '0.5rem' }}>{t('admin.economy.users.title')}</h3>
            <p style={{ color: '#9ca3af', fontSize: '0.875rem', marginBottom: '1.5rem' }}>{t('admin.economy.users.description')}</p>

            <div style={{ marginBottom: '1.5rem' }}>
                <Label>{t('admin.economy.users.search_placeholder')}</Label>
                <Input
                    placeholder={t('admin.economy.users.search_placeholder')}
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                />
            </div>

            {loading && <Spinner centered size={'small'} />}

            <FlashMessageRender byKey={'economy:user-save'} css={tw`mb-4`} />

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {users.map(user => (
                    <div key={user.id} style={{ padding: '1.25rem', backgroundColor: 'rgba(255,255,255,0.03)', borderRadius: '1rem', border: '1px solid rgba(255,255,255,0.05)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div>
                                <div style={{ color: 'white', fontWeight: 600 }}>{user.username}</div>
                                <div style={{ color: '#9ca3af', fontSize: '0.75rem' }}>{user.email}</div>
                            </div>
                            <Button
                                onClick={() => setEditing(editing === user.id ? null : user.id)}
                            >
                                {editing === user.id ? t('common.cancel') : t('global.modify')}
                            </Button>
                        </div>

                        {editing === user.id && (
                            <Formik
                                initialValues={{
                                    points: user.points,
                                    cpu: user.resources.cpu,
                                    ram: user.resources.ram,
                                    disk: user.resources.disk,
                                    backups: user.resources.backups,
                                    allocations: user.resources.allocations,
                                    slots: user.resources.slots,
                                }}
                                onSubmit={(values, helpers) => saveUser(user.id, values, helpers)}
                            >
                                {({ isSubmitting }) => (
                                    <Form style={{ marginTop: '1.5rem', display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1.25rem' }}>
                                        <div style={{ gridColumn: 'span 2', padding: '0.5rem', borderLeft: '4px solid #3b82f6', backgroundColor: 'rgba(59, 130, 246, 0.1)', color: 'white', fontWeight: 600 }}>
                                            {t('admin.economy.users.editing', { name: user.username })}
                                        </div>
                                        <div>
                                            <Label>{t('admin.economy.resources.points')}</Label>
                                            <Field name="points" as={Input} type="number" />
                                        </div>
                                        <div>
                                            <Label>{t('admin.economy.resources.cpu')}</Label>
                                            <Field name="cpu" as={Input} type="number" />
                                        </div>
                                        <div>
                                            <Label>{t('admin.economy.resources.ram')}</Label>
                                            <Field name="ram" as={Input} type="number" />
                                        </div>
                                        <div>
                                            <Label>{t('admin.economy.resources.disk')}</Label>
                                            <Field name="disk" as={Input} type="number" />
                                        </div>
                                        <div>
                                            <Label>{t('admin.economy.resources.backups')}</Label>
                                            <Field name="backups" as={Input} type="number" />
                                        </div>
                                        <div>
                                            <Label>{t('admin.economy.resources.allocations')}</Label>
                                            <Field name="allocations" as={Input} type="number" />
                                        </div>
                                        <div>
                                            <Label>{t('admin.economy.resources.slots')}</Label>
                                            <Field name="slots" as={Input} type="number" />
                                        </div>
                                        <div style={{ gridColumn: 'span 2', display: 'flex', justifyContent: 'flex-end', marginTop: '0.5rem' }}>
                                            <Button type="submit" disabled={isSubmitting}>
                                                {t('common.save')}
                                            </Button>
                                        </div>
                                    </Form>
                                )}
                            </Formik>
                        )}
                    </div>
                ))}
            </div>
        </Card>
    );
};

const CoreSelector = ({ settings, onUpdate }: { settings: EconomySettings, onUpdate: (ids: number[]) => void }) => {
    const { t } = useTranslation();
    const [nests, setNests] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        http.get('/admin/economy/nests')
            .then(({ data }: any) => setNests(data))
            .catch(console.error)
            .finally(() => setLoading(false));
    }, []);

    const toggleEgg = (eggId: number) => {
        const current = [...settings.allowed_eggs];
        const index = current.indexOf(eggId);
        if (index > -1) {
            current.splice(index, 1);
        } else {
            current.push(eggId);
        }
        onUpdate(current);
    };

    if (loading) return <Spinner centered size={'small'} />;

    return (
        <Card>
            <h3 style={{ color: 'white', fontSize: '1.25rem', fontWeight: 700, marginBottom: '0.5rem' }}>{t('admin.economy.cores.title')}</h3>
            <p style={{ color: '#9ca3af', fontSize: '0.875rem', marginBottom: '1.5rem' }}>{t('admin.economy.cores.description')}</p>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1.5rem' }}>
                {nests.map((nest: any) => (
                    <div key={nest.id} style={{ padding: '1.25rem', backgroundColor: 'rgba(255,255,255,0.03)', borderRadius: '1rem', border: '1px solid rgba(255,255,255,0.05)' }}>
                        <div style={{ color: 'white', fontWeight: 700, marginBottom: '1rem', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '0.5rem' }}>
                            {nest.name}
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                            {nest.eggs.map((egg: any) => (
                                <label key={egg.id} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', cursor: 'pointer', padding: '0.5rem', borderRadius: '0.5rem', transition: 'all 0.2s' }} className="hover:bg-white/5">
                                    <input
                                        type="checkbox"
                                        checked={settings.allowed_eggs.includes(egg.id)}
                                        onChange={() => toggleEgg(egg.id)}
                                        style={{ width: '1.25rem', height: '1.25rem', borderRadius: '0.25rem', cursor: 'pointer' }}
                                    />
                                    <span style={{ color: settings.allowed_eggs.includes(egg.id) ? 'white' : '#9ca3af' }}>{egg.name}</span>
                                </label>
                            ))}
                        </div>
                    </div>
                ))}
            </div>

            <div style={{ position: 'fixed', bottom: '2rem', right: '2rem', zIndex: 999 }}>
                <button
                    type="button"
                    onClick={() => {
                        http.post('/admin/economy/settings', settings)
                            .then(() => {
                                (window as any).swal({
                                    title: t('admin.economy.cores.save_success'),
                                    text: t('admin.economy.cores.save_success_desc'),
                                    type: 'success',
                                    confirmButtonText: t('admin.economy.notifications.confirm')
                                }, () => {
                                    window.location.reload();
                                });
                            })
                            .catch((err: any) => {
                                (window as any).swal({
                                    title: t('admin.economy.cores.save_error'),
                                    text: err.message,
                                    type: 'error',
                                    confirmButtonText: t('admin.economy.notifications.confirm')
                                });
                            });
                    }}
                    style={{
                        padding: '1rem 2.5rem',
                        borderRadius: '1rem',
                        fontWeight: 800,
                        fontSize: '1.125rem',
                        transition: 'all 0.2s',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '0.75rem',
                        border: 'none',
                        cursor: 'pointer',
                        backgroundColor: '#3b82f6',
                        color: 'white',
                        boxShadow: '0 10px 25px -5px rgba(59, 130, 246, 0.4)'
                    }}
                >
                    <FontAwesomeIcon icon={faSave} />
                    {t('admin.economy.cores.save_button')}
                </button>
            </div>
        </Card>
    );
};

const NodeSelector = ({ settings, onUpdate }: { settings: EconomySettings, onUpdate: (ids: number[]) => void }) => {
    const { t } = useTranslation();
    const [locations, setLocations] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        setLoading(true);
        http.get('/admin/economy/locations')
            .then(({ data }: any) => setLocations(data))
            .catch(console.error)
            .finally(() => setLoading(false));
    }, []);

    const toggleNode = (nodeId: number) => {
        const current = [...settings.allowed_nodes];
        const index = current.indexOf(nodeId);
        if (index > -1) {
            current.splice(index, 1);
        } else {
            current.push(nodeId);
        }
        onUpdate(current);
    };

    if (loading) return <Spinner centered size={'small'} />;

    return (
        <Card>
            <h3 style={{ color: 'white', fontSize: '1.25rem', fontWeight: 700, marginBottom: '0.5rem' }}>{t('admin.economy.nodes.title')}</h3>
            <p style={{ color: '#9ca3af', fontSize: '0.875rem', marginBottom: '1.5rem' }}>{t('admin.economy.nodes.description')}</p>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1.5rem' }}>
                {locations.filter((loc: any) => loc.nodes.length > 0).map((loc: any) => (
                    <div key={loc.id} style={{ padding: '1.25rem', backgroundColor: 'rgba(255,255,255,0.03)', borderRadius: '1rem', border: '1px solid rgba(255,255,255,0.05)' }}>
                        <div style={{ color: 'white', fontWeight: 700, marginBottom: '1rem', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '0.5rem' }}>
                            {loc.name}
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                            {loc.nodes.map((node: any) => (
                                <label key={node.id} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', cursor: 'pointer', padding: '0.5rem', borderRadius: '0.5rem', transition: 'all 0.2s' }} className="hover:bg-white/5">
                                    <input
                                        type="checkbox"
                                        checked={settings.allowed_nodes.includes(node.id)}
                                        onChange={() => toggleNode(node.id)}
                                        style={{ width: '1.25rem', height: '1.25rem', borderRadius: '0.25rem', cursor: 'pointer' }}
                                    />
                                    <span style={{ color: settings.allowed_nodes.includes(node.id) ? 'white' : '#9ca3af' }}>{node.name}</span>
                                </label>
                            ))}
                        </div>
                    </div>
                ))}
            </div>

            <div style={{ position: 'fixed', bottom: '2rem', right: '2rem', zIndex: 999 }}>
                <button
                    type="button"
                    onClick={() => {
                        http.post('/admin/economy/settings', settings)
                            .then(() => {
                                (window as any).swal({
                                    title: t('admin.economy.nodes.save_success'),
                                    text: t('admin.economy.nodes.save_success_desc'),
                                    type: 'success',
                                    confirmButtonText: t('admin.economy.notifications.confirm')
                                }, () => {
                                    window.location.reload();
                                });
                            })
                            .catch((err: any) => {
                                (window as any).swal({
                                    title: t('admin.economy.nodes.save_error'),
                                    text: err.message,
                                    type: 'error',
                                    confirmButtonText: t('admin.economy.notifications.confirm')
                                });
                            });
                    }}
                    style={{
                        padding: '1rem 2.5rem',
                        borderRadius: '1rem',
                        fontWeight: 800,
                        fontSize: '1.125rem',
                        transition: 'all 0.2s',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '0.75rem',
                        border: 'none',
                        cursor: 'pointer',
                        backgroundColor: '#3b82f6',
                        color: 'white',
                        boxShadow: '0 10px 25px -5px rgba(59, 130, 246, 0.4)'
                    }}
                >
                    <FontAwesomeIcon icon={faSave} />
                    {t('admin.economy.nodes.save_button')}
                </button>
            </div>
        </Card>
    );
};

const EconomyManager = () => {
    const { t } = useTranslation();
    const { addFlash, clearFlashes } = useFlash();
    const [loading, setLoading] = useState(true);
    const [settings, setSettings] = useState<EconomySettings | null>(null);
    const [activeTab, setActiveTab] = useState('general');

    useEffect(() => {
        http.get('/admin/economy/settings')
            .then(({ data }) => setSettings(data))
            .catch(error => {
                console.error(error);
                addFlash({ type: 'error', message: httpErrorToHuman(error), key: 'economy:load' });
            })
            .finally(() => setLoading(false));
    }, []);

    const submit = (values: EconomySettings, { setSubmitting }: FormikHelpers<EconomySettings>) => {
        clearFlashes('economy:save');
        http.post('/admin/economy/settings', values)
            .then(() => {
                (window as any).swal({
                    title: t('admin.economy.notifications.save_success'),
                    text: t('admin.economy.notifications.save_success_desc'),
                    type: 'success',
                    confirmButtonText: t('admin.economy.notifications.confirm')
                }, () => {
                    window.location.reload();
                });
            })
            .catch(error => {
                console.error(error);
                (window as any).swal({
                    title: t('admin.economy.notifications.save_error'),
                    text: httpErrorToHuman(error),
                    type: 'error',
                    confirmButtonText: t('admin.economy.notifications.confirm')
                });
            })
            .finally(() => setSubmitting(false));
    };

    if (loading || !settings) {
        return <Spinner centered />;
    }

    return (
        <Container>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '2.5rem' }}>
                <div style={{ width: '3.5rem', height: '3.5rem', backgroundColor: 'rgba(59, 130, 246, 0.2)', borderRadius: '1.25rem', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#3b82f6' }}>
                    <FontAwesomeIcon icon={faCoins} size="2x" />
                </div>
                <div>
                    <h2 style={{ fontSize: '1.75rem', fontWeight: 800, color: 'white', lineHeight: 1, marginBottom: '0.35rem' }}>{t('admin.economy.title')}</h2>
                    <p style={{ color: '#9ca3af', fontSize: '1rem' }}>{t('admin.economy.subtitle')}</p>
                </div>
            </div>

            <NavContainer>
                <NavItem active={activeTab === 'general'} onClick={() => setActiveTab('general')}>
                    <FontAwesomeIcon icon={faCogs} /> {t('admin.economy.tabs.general')}
                </NavItem>
                <NavItem active={activeTab === 'resources'} onClick={() => setActiveTab('resources')}>
                    <FontAwesomeIcon icon={faGem} /> {t('admin.economy.tabs.resources')}
                </NavItem>
                <NavItem active={activeTab === 'shop'} onClick={() => setActiveTab('shop')}>
                    <FontAwesomeIcon icon={faShoppingCart} /> {t('admin.economy.tabs.shop')}
                </NavItem>
                <NavItem active={activeTab === 'promocodes'} onClick={() => setActiveTab('promocodes')}>
                    <FontAwesomeIcon icon={faTicketAlt} /> {t('admin.economy.tabs.promocodes')}
                </NavItem>
                <NavItem active={activeTab === 'cores'} onClick={() => setActiveTab('cores')}>
                    <FontAwesomeIcon icon={faServer} /> {t('admin.economy.tabs.cores')}
                </NavItem>
                <NavItem active={activeTab === 'nodes'} onClick={() => setActiveTab('nodes')}>
                    <FontAwesomeIcon icon={faServer} /> {t('admin.economy.tabs.nodes')}
                </NavItem>
                <NavItem active={activeTab === 'users'} onClick={() => setActiveTab('users')}>
                    <FontAwesomeIcon icon={faUsers} /> {t('admin.economy.tabs.users')}
                </NavItem>
                <NavItem active={activeTab === 'billing'} onClick={() => setActiveTab('billing')}>
                    <FontAwesomeIcon icon={faCoins} /> {t('admin.economy.tabs.billing')}
                </NavItem>
            </NavContainer>


            <FlashMessageRender byKey={'economy:load'} css={tw`mb-4`} />

            {activeTab === 'promocodes' && <PromoCodeManager />}
            {activeTab === 'users' && <UserResourceEditor />}
            {activeTab === 'cores' && <CoreSelector settings={settings} onUpdate={(ids) => setSettings({ ...settings, allowed_eggs: ids })} />}
            {activeTab === 'nodes' && <NodeSelector settings={settings} onUpdate={(ids) => setSettings({ ...settings, allowed_nodes: ids })} />}
            {activeTab === 'billing' && (
                <Formik
                    initialValues={settings}
                    onSubmit={submit}
                    enableReinitialize
                >
                    {({ isSubmitting, values, setFieldValue }) => (
                        <Form>
                            <Card>
                                <div className={'flex items-center justify-between'}>
                                    <div>
                                        <span style={{ color: 'white', fontWeight: 700, fontSize: '1.125rem', display: 'block' }}>{t('admin.economy.billing.enabled')}</span>
                                        <span style={{ color: '#9ca3af', fontSize: '0.875rem' }}>{t('admin.economy.billing.enabled_desc')}</span>
                                    </div>
                                    <Switch
                                        name={'billing.enabled'}
                                        defaultChecked={values.billing.enabled}
                                        onChange={() => setFieldValue('billing.enabled', !values.billing.enabled)}
                                    />
                                </div>
                            </Card>

                            <Card>
                                <h3 style={{ color: 'white', fontSize: '1.25rem', fontWeight: 700, marginBottom: '1.5rem' }}>{t('admin.economy.billing.pricing_title')}</h3>
                                <div className={'grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6'}>
                                    <div>
                                        <Label>{t('admin.economy.billing.base_price')}</Label>
                                        <Field name={'billing.base_price'} as={Input} type={'number'} />
                                    </div>
                                    <div>
                                        <Label>{t('admin.economy.billing.cpu_coeff')}</Label>
                                        <Field name={'billing.cpu_coeff'} as={Input} type={'number'} step={'0.01'} />
                                    </div>
                                    <div>
                                        <Label>{t('admin.economy.billing.ram_coeff')}</Label>
                                        <Field name={'billing.ram_coeff'} as={Input} type={'number'} step={'0.0001'} />
                                    </div>
                                    <div>
                                        <Label>{t('admin.economy.billing.disk_coeff')}</Label>
                                        <Field name={'billing.disk_coeff'} as={Input} type={'number'} step={'0.0001'} />
                                    </div>
                                </div>
                            </Card>

                            <Card>
                                <h3 style={{ color: 'white', fontSize: '1.25rem', fontWeight: 700, marginBottom: '1.5rem' }}>{t('admin.economy.billing.multipliers_title')}</h3>
                                <div className={'grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6'}>
                                    <div>
                                        <Label>{t('admin.economy.billing.hourly_multiplier')}</Label>
                                        <Field name={'billing.hourly_multiplier'} as={Input} type={'number'} step={'0.000001'} />
                                    </div>
                                    <div>
                                        <Label>{t('admin.economy.billing.daily_multiplier')}</Label>
                                        <Field name={'billing.daily_multiplier'} as={Input} type={'number'} step={'0.001'} />
                                    </div>
                                    <div>
                                        <Label>{t('admin.economy.billing.weekly_multiplier')}</Label>
                                        <Field name={'billing.weekly_multiplier'} as={Input} type={'number'} step={'0.01'} />
                                    </div>
                                    <div>
                                        <Label>{t('admin.economy.billing.monthly_multiplier')}</Label>
                                        <Field name={'billing.monthly_multiplier'} as={Input} type={'number'} step={'0.1'} />
                                    </div>
                                </div>
                            </Card>

                            <Card>
                                <h3 style={{ color: 'white', fontSize: '1.25rem', fontWeight: 700, marginBottom: '1.5rem' }}>{t('admin.economy.billing.grace_title')}</h3>
                                <div className={'grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6'}>
                                    <div>
                                        <Label>{t('admin.economy.billing.grace_period_hours')}</Label>
                                        <Field name={'billing.grace_period_hours'} as={Input} type={'number'} />
                                        <p style={{ color: '#6b7280', fontSize: '0.75rem', marginTop: '0.25rem' }}>{t('admin.economy.billing.grace_period_help')}</p>
                                    </div>
                                    <div>
                                        <Label>{t('admin.economy.billing.pending_delete_days')}</Label>
                                        <Field name={'billing.pending_delete_days'} as={Input} type={'number'} />
                                        <p style={{ color: '#6b7280', fontSize: '0.75rem', marginTop: '0.25rem' }}>{t('admin.economy.billing.pending_delete_help')}</p>
                                    </div>
                                </div>
                            </Card>

                            <Card>
                                <h3 style={{ color: 'white', fontSize: '1.25rem', fontWeight: 700, marginBottom: '1.5rem' }}>{t('admin.economy.billing.webhook_title')}</h3>
                                <div>
                                    <Label>{t('admin.economy.billing.webhook_url')}</Label>
                                    <Field name={'billing.webhook_url'} as={Input} type={'text'} placeholder={'https://your-webhook-url.com'} />
                                    <p style={{ color: '#6b7280', fontSize: '0.75rem', marginTop: '0.25rem' }}>{t('admin.economy.billing.webhook_help')}</p>
                                </div>
                            </Card>

                            <div style={{ position: 'fixed', bottom: '2rem', right: '2rem', zIndex: 999 }}>
                                <button
                                    type={'submit'}
                                    disabled={isSubmitting}
                                    style={{
                                        padding: '1rem 2.5rem',
                                        borderRadius: '1rem',
                                        fontWeight: 800,
                                        fontSize: '1.125rem',
                                        transition: 'all 0.2s',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        gap: '0.75rem',
                                        border: 'none',
                                        cursor: isSubmitting ? 'not-allowed' : 'pointer',
                                        backgroundColor: isSubmitting ? '#4b5563' : '#3b82f6',
                                        color: 'white',
                                        boxShadow: '0 10px 25px -5px rgba(59, 130, 246, 0.4)',
                                    }}
                                >
                                    <FontAwesomeIcon icon={isSubmitting ? faSave : faSave} spin={isSubmitting} />
                                    {isSubmitting ? t('common.saving') : t('common.save')}
                                </button>
                            </div>
                        </Form>
                    )}
                </Formik>
            )}

            {['general', 'resources', 'shop'].includes(activeTab) && (

                <Formik
                    initialValues={settings}
                    onSubmit={submit}
                    enableReinitialize
                >
                    {({ isSubmitting, values, setFieldValue }: any) => (
                        <Form>
                            {activeTab === 'general' && (
                                <>
                                    <Card>
                                        <div className={'flex items-center justify-between'}>
                                            <div>
                                                <span style={{ color: 'white', fontWeight: 700, fontSize: '1.125rem', display: 'block' }}>{t('admin.economy.general.enabled')}</span>
                                                <span style={{ color: '#9ca3af', fontSize: '0.875rem' }}>{t('admin.economy.general.enabled_desc')}</span>
                                            </div>
                                            <Switch
                                                name={'enabled'}
                                                defaultChecked={values.enabled}
                                                onChange={() => setFieldValue('enabled', !values.enabled)}
                                            />
                                        </div>
                                    </Card>

                                    <Card>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
                                            <FontAwesomeIcon icon={faKey} style={{ color: '#3b82f6' }} />
                                            <h3 style={{ color: 'white', fontSize: '1.25rem', fontWeight: 700 }}>{t('admin.economy.general.api_title')}</h3>
                                        </div>
                                        <p style={{ color: '#9ca3af', fontSize: '0.875rem', marginBottom: '1.5rem' }}>{t('admin.economy.general.api_desc')}</p>

                                        <div style={{ marginBottom: '2rem', padding: '1.5rem', backgroundColor: 'rgba(255,255,255,0.03)', borderRadius: '1rem', border: '1px solid rgba(255,255,255,0.05)' }}>
                                            <Label>{t('admin.economy.general.api_token')}</Label>
                                            <div style={{ display: 'flex', gap: '0.75rem' }}>
                                                <Input
                                                    id={'new_token_name'}
                                                    placeholder={t('admin.economy.general.api_placeholder')}
                                                />
                                                <Button
                                                    type={'button'}
                                                    onClick={() => {
                                                        const nameInput = document.getElementById('new_token_name') as HTMLInputElement;
                                                        if (!nameInput.value) return;

                                                        const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
                                                        let str = '';
                                                        for (let i = 0; i < 32; i++) str += chars.charAt(Math.floor(Math.random() * chars.length));
                                                        const newToken: ApiToken = {
                                                            id: Math.random().toString(36).substring(2, 9),
                                                            name: nameInput.value,
                                                            token: 'ep_' + str,
                                                            created_at: Math.floor(Date.now() / 1000),
                                                        };
                                                        setFieldValue('api_tokens', [...values.api_tokens, newToken]);
                                                        nameInput.value = '';
                                                        addFlash({ type: 'success', message: t('admin.economy.general.api_success_create'), key: 'economy:save' });
                                                    }}
                                                    variant="secondary"
                                                    style={{ whiteSpace: 'nowrap' }}
                                                >
                                                    {t('admin.economy.general.generate_token')}
                                                </Button>
                                            </div>
                                            <p style={{ color: '#3b82f6', fontSize: '0.75rem', marginTop: '0.5rem', fontWeight: 600 }}>
                                                {t('admin.economy.general.doc_save_reminder')}
                                            </p>
                                        </div>

                                        <div style={{ marginBottom: '2rem' }}>
                                            <Label style={{ marginBottom: '1rem' }}>{t('admin.economy.general.api_list_title')}</Label>
                                            {values.api_tokens.length === 0 ? (
                                                <p style={{ color: '#6b7280', fontSize: '0.875rem', textAlign: 'center', padding: '2rem', border: '2px dashed rgba(255,255,255,0.05)', borderRadius: '1rem' }}>
                                                    {t('admin.economy.general.api_list_empty')}
                                                </p>
                                            ) : (
                                                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                                                    {values.api_tokens.map((token: ApiToken) => (
                                                        <div key={token.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem', backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: '0.75rem', border: '1px solid rgba(255,255,255,0.1)' }}>
                                                            <div>
                                                                <div style={{ color: 'white', fontWeight: 600 }}>{token.name}</div>
                                                                <div style={{ color: '#3b82f6', fontFamily: 'monospace', fontSize: '0.875rem', marginTop: '0.25rem' }}>{token.token}</div>
                                                            </div>
                                                            <Button
                                                                type={'button'}
                                                                variant="danger"
                                                                onClick={() => {
                                                                    if (confirm(t('admin.economy.general.api_revoke_confirm'))) {
                                                                        setFieldValue('api_tokens', values.api_tokens.filter((t: ApiToken) => t.id !== token.id));
                                                                    }
                                                                }}
                                                                style={{ padding: '0.5rem 1rem', fontSize: '0.875rem' }}
                                                            >
                                                                {t('admin.economy.general.api_revoke')}
                                                            </Button>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </div>

                                        <div style={{ padding: '1.5rem', backgroundColor: 'rgba(59, 130, 246, 0.05)', borderRadius: '1rem', border: '1px solid rgba(59, 130, 246, 0.2)' }}>
                                            <h4 style={{ color: 'white', fontWeight: 700, marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                                <FontAwesomeIcon icon={faCogs} size="sm" />
                                                {t('admin.economy.general.doc_title')}
                                            </h4>
                                            <div style={{ color: '#9ca3af', fontSize: '0.875rem', lineHeight: 1.6 }}>
                                                <p style={{ marginBottom: '1rem' }}>{t('admin.economy.general.doc_desc')}</p>

                                                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                                                    <div>
                                                        <span style={{ color: 'white', fontWeight: 600, display: 'block', marginBottom: '0.25rem' }}>{t('admin.economy.general.doc_get_user')}</span>
                                                        <code style={{ display: 'block', backgroundColor: 'black', padding: '0.75rem', borderRadius: '0.5rem', color: '#10b981', overflowX: 'auto', marginBottom: '0.5rem' }}>
                                                            {window.location.origin}/api/external/economy/users/{"{identifier}"}
                                                        </code>
                                                    </div>

                                                    <div>
                                                        <span style={{ color: 'white', fontWeight: 600, display: 'block', marginBottom: '0.25rem' }}>{t('admin.economy.general.doc_add_user')}</span>
                                                        <code style={{ display: 'block', backgroundColor: 'black', padding: '0.75rem', borderRadius: '0.5rem', color: '#3b82f6', overflowX: 'auto', marginBottom: '0.5rem' }}>
                                                            {window.location.origin}/api/external/economy/users/{"{identifier}"}/add
                                                        </code>
                                                    </div>

                                                    <div>
                                                        <span style={{ color: 'white', fontWeight: 600, display: 'block', marginBottom: '0.25rem' }}>{t('admin.economy.general.doc_set_user')}</span>
                                                        <code style={{ display: 'block', backgroundColor: 'black', padding: '0.75rem', borderRadius: '0.5rem', color: '#f59e0b', overflowX: 'auto', marginBottom: '1rem' }}>
                                                            {window.location.origin}/api/external/economy/users/{"{identifier}"}/set
                                                        </code>
                                                    </div>

                                                    <div style={{ marginBottom: '1rem', padding: '1rem', backgroundColor: 'rgba(255,255,255,0.03)', borderRadius: '0.5rem' }}>
                                                        <span style={{ color: 'white', fontWeight: 600, display: 'block', marginBottom: '0.5rem' }}>{t('admin.economy.general.doc_params_title')}</span>
                                                        <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '0.25rem', fontSize: '0.75rem' }}>
                                                            <li style={{ color: '#d1d5db' }}>• {t('admin.economy.general.doc_params_points')}</li>
                                                            <li style={{ color: '#d1d5db' }}>• {t('admin.economy.general.doc_params_resources')}</li>
                                                        </ul>
                                                    </div>

                                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                                        <div>
                                                            <span style={{ color: '#9ca3af', fontSize: '0.75rem', display: 'block', marginBottom: '0.25rem' }}>{t('admin.economy.general.doc_example_add')}</span>
                                                            <pre style={{ backgroundColor: 'black', padding: '0.5rem', borderRadius: '0.4rem', color: '#3b82f6', fontSize: '0.7rem' }}>
                                                                {`{ "amount": 100 }`}
                                                            </pre>
                                                        </div>
                                                        <div>
                                                            <span style={{ color: '#9ca3af', fontSize: '0.75rem', display: 'block', marginBottom: '0.25rem' }}>{t('admin.economy.general.doc_example_set')}</span>
                                                            <pre style={{ backgroundColor: 'black', padding: '0.5rem', borderRadius: '0.4rem', color: '#f59e0b', fontSize: '0.7rem' }}>
                                                                {`{ "amount": 500 }`}
                                                            </pre>
                                                        </div>
                                                    </div>

                                                    <div style={{ marginTop: '0.5rem', padding: '0.75rem', backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: '0.5rem', borderLeft: '4px solid #3b82f6' }}>
                                                        <span style={{ color: 'white', fontWeight: 600 }}>{t('admin.economy.general.doc_header')}</span>
                                                        <code style={{ display: 'block', color: '#d1d5db', marginTop: '0.25rem' }}>
                                                            Authorization: Bearer YOUR_TOKEN
                                                        </code>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </Card>
                                </>
                            )}

                            {activeTab === 'resources' && (
                                <>
                                    <Card>
                                        <h3 style={{ color: 'white', fontSize: '1.25rem', fontWeight: 700, marginBottom: '1.5rem' }}>{t('admin.economy.resources.defaults_title')}</h3>
                                        <div className={'grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6'}>
                                            <div>
                                                <Label>{t('admin.economy.resources.points')}</Label>
                                                <Field name={'defaults.points'} as={Input} type={'number'} />
                                            </div>
                                            <div />
                                            <div>
                                                <Label>{t('admin.economy.resources.cpu')}</Label>
                                                <Field name={'defaults.cpu'} as={Input} type={'number'} />
                                            </div>
                                            <div>
                                                <Label>{t('admin.economy.resources.ram')}</Label>
                                                <Field name={'defaults.ram'} as={Input} type={'number'} />
                                            </div>
                                            <div>
                                                <Label>{t('admin.economy.resources.disk')}</Label>
                                                <Field name={'defaults.disk'} as={Input} type={'number'} />
                                            </div>
                                            <div>
                                                <Label>{t('admin.economy.resources.backups')}</Label>
                                                <Field name={'defaults.backups'} as={Input} type={'number'} />
                                            </div>
                                            <div>
                                                <Label>{t('admin.economy.resources.allocations')}</Label>
                                                <Field name={'defaults.allocations'} as={Input} type={'number'} />
                                            </div>
                                            <div>
                                                <Label>{t('admin.economy.resources.slots')}</Label>
                                                <Field name={'defaults.slots'} as={Input} type={'number'} />
                                            </div>
                                        </div>
                                    </Card>

                                    <Card>
                                        <h3 style={{ color: 'white', fontSize: '1.25rem', fontWeight: 700, marginBottom: '0.5rem' }}>{t('admin.economy.resources.min_limits_title')}</h3>
                                        <p style={{ color: '#9ca3af', fontSize: '0.875rem', marginBottom: '1.5rem' }}>{t('admin.economy.resources.min_limits_desc')}</p>
                                        <div className={'grid grid-cols-1 md:grid-cols-3 gap-x-8 gap-y-6'}>
                                            <div>
                                                <Label>{t('admin.economy.resources.cpu')} (Min)</Label>
                                                <Field name={'min_limits.cpu'} as={Input} type={'number'} />
                                            </div>
                                            <div>
                                                <Label>{t('admin.economy.resources.ram')} (Min)</Label>
                                                <Field name={'min_limits.ram'} as={Input} type={'number'} />
                                            </div>
                                            <div>
                                                <Label>{t('admin.economy.resources.disk')} (Min)</Label>
                                                <Field name={'min_limits.disk'} as={Input} type={'number'} />
                                            </div>
                                        </div>
                                    </Card>
                                </>
                            )}

                            {activeTab === 'shop' && (
                                <Card>
                                    <h3 style={{ color: 'white', fontSize: '1.25rem', fontWeight: 700, marginBottom: '0.5rem' }}>{t('admin.economy.shop.title')}</h3>
                                    <p style={{ color: '#9ca3af', fontSize: '0.875rem', marginBottom: '1.5rem' }}>{t('admin.economy.shop.description')}</p>
                                    <div className={'grid grid-cols-1 xl:grid-cols-2 gap-x-8 gap-y-6'}>
                                        {Object.keys(values.bundles).map((key) => {
                                            const type = key as keyof Bundles;
                                            const unitLabel = t(`admin.economy.shop.unit_${type}` as any);
                                            return (
                                                <div key={type} className={'p-5 bg-gray-900 bg-opacity-50 rounded-2xl border border-gray-800'}>
                                                    <h4 style={{ color: 'white', fontWeight: 700, marginBottom: '0.75rem', textTransform: 'capitalize' }}>
                                                        {t(`admin.economy.resources.${type}` as any)}
                                                    </h4>
                                                    <div className={'grid grid-cols-2 gap-4'}>
                                                        <div>
                                                            <Label>{t('admin.economy.shop.amount_label')} ({unitLabel})</Label>
                                                            <Field name={`bundles.${type}.amount`} as={Input} type={'number'} />
                                                        </div>
                                                        <div>
                                                            <Label>{t('admin.economy.shop.price_label')}</Label>
                                                            <Field name={`bundles.${type}.price`} as={Input} type={'number'} />
                                                        </div>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </Card>
                            )}

                            <div style={{ position: 'fixed', bottom: '2rem', right: '2rem', zIndex: 999 }}>
                                <button
                                    type={'submit'}
                                    disabled={isSubmitting}
                                    style={{
                                        padding: '1rem 2.5rem',
                                        borderRadius: '1rem',
                                        fontWeight: 800,
                                        fontSize: '1.125rem',
                                        transition: 'all 0.2s',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        gap: '0.75rem',
                                        border: 'none',
                                        cursor: isSubmitting ? 'not-allowed' : 'pointer',
                                        backgroundColor: isSubmitting ? '#4b5563' : '#3b82f6',
                                        color: 'white',
                                        boxShadow: '0 10px 25px -5px rgba(59, 130, 246, 0.4)',
                                    }}
                                >
                                    <FontAwesomeIcon icon={isSubmitting ? faSave : faSave} spin={isSubmitting} />
                                    {isSubmitting ? t('common.saving') : t('common.save')}
                                </button>
                            </div>
                        </Form>
                    )}
                </Formik>
            )}
        </Container>
    );
};

export default EconomyManager;
