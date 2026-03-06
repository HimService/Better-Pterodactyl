import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useHistory } from 'react-router-dom';
import useFlash from '@/plugins/useFlash';
import { httpErrorToHuman } from '@/api/http';
import http from '@/api/http';
import FlashMessageRender from '@/components/FlashMessageRender';
import Spinner from '@/components/elements/Spinner';
import ContentBox from '@/components/elements/ContentBox';
import styled from 'styled-components';
import Button from '@/components/elements/Button';
import { Field, Form, Formik, useFormikContext } from 'formik';
import Input from '@/components/elements/Input';
import Label from '@/components/elements/Label';
import Select from '@/components/elements/Select';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faServer, faMicrochip, faMemory, faHdd, faLayerGroup } from '@fortawesome/free-solid-svg-icons';
import { formatMB } from '@/helpers';

const ResourceGrid = styled.div`
    display: grid;
    grid-template-columns: repeat(1, 1fr);
    gap: 1.5rem;
    margin-bottom: 2rem;
    
    @media (min-width: 768px) {
        grid-template-columns: repeat(4, 1fr);
    }
`;

const ResourceStat = styled.div`
    background: rgba(255, 255, 255, 0.05);
    padding: 1rem;
    border-radius: 0.75rem;
    border: 1px solid rgba(255, 255, 255, 0.1);
    
    .label {
        color: #9ca3af;
        font-size: 0.75rem;
        margin-bottom: 0.25rem;
    }
    .value {
        color: white;
        font-size: 1.25rem;
        font-weight: 700;
    }
`;

interface ResourceData {
    nests: any[];
    locations: any[];
    min_limits: {
        cpu: number;
        ram: number;
        disk: number;
    };
}

interface EconomyData {
    points: number;
    resources: {
        cpu: number;
        ram: number;
        disk: number;
        backups: number;
        allocations: number;
        slots: number;
    };
    usage: {
        cpu: number;
        ram: number;
        disk: number;
        backups: number;
        allocations: number;
        slots: number;
    };
    settings: {
        enabled: boolean;
        defaults: any;
        billing?: {
            enabled: boolean;
            base_price: number;
            cpu_coeff: number;
            ram_coeff: number;
            disk_coeff: number;
        };
    };
}

const CreateServerContainer = () => {
    const { t } = useTranslation('translation');
    const history = useHistory();
    const { addFlash } = useFlash();
    const [loading, setLoading] = useState(true);
    const [resources, setResources] = useState<ResourceData | null>(null);
    const [economy, setEconomy] = useState<EconomyData | null>(null);

    useEffect(() => {
        Promise.all([
            http.get('/api/client/economy'),
            http.get('/api/client/economy/resources')
        ]).then(([ecoRes, resRes]) => {
            setEconomy(ecoRes.data);
            setResources(resRes.data);
        }).catch(error => {
            addFlash({ type: 'error', message: httpErrorToHuman(error), key: 'economy:create-load' });
        }).finally(() => setLoading(false));
    }, []);

    if (loading || !economy || !resources) return <Spinner centered />;

    const totalCPU = (economy.settings.defaults?.cpu || 0) + (economy.resources?.cpu || 0);
    const totalRAM = (economy.settings.defaults?.ram || 0) + (economy.resources?.ram || 0);
    const totalDisk = (economy.settings.defaults?.disk || 0) + (economy.resources?.disk || 0);
    const totalSlots = (economy.settings.defaults?.slots || 0) + (economy.resources?.slots || 0);
    const totalAllocations = (economy.settings.defaults?.allocations || 0) + (economy.resources?.allocations || 0);
    const totalBackups = (economy.settings.defaults?.backups || 0) + (economy.resources?.backups || 0);

    const availCPU = totalCPU - (economy.usage?.cpu || 0);
    const availRAM = totalRAM - (economy.usage?.ram || 0);
    const availDisk = totalDisk - (economy.usage?.disk || 0);
    const availSlots = totalSlots - (economy.usage?.slots || 0);
    const availAllocations = totalAllocations - (economy.usage?.allocations || 0);
    const availBackups = totalBackups - (economy.usage?.backups || 0);

    const submit = (values: any, { setSubmitting }: any) => {
        http.post('/api/client/economy/servers', values)
            .then(() => {
                addFlash({ type: 'success', message: t('economy.create_server.success'), key: 'economy:create-success' });
                history.push('/');
            })
            .catch(error => {
                addFlash({ type: 'error', message: httpErrorToHuman(error), key: 'economy:create-error' });
                setSubmitting(false);
            });
    };

    return (
        <ContentBox title={t('economy.create_server.title')} showLoadingOverlay={loading}>
            <FlashMessageRender byKey={'economy:create-success'} className="mb-4" />
            <FlashMessageRender byKey={'economy:create-error'} className="mb-4" />
            <ResourceGrid>
                <ResourceStat shadow-md>
                    <div className="label"><FontAwesomeIcon icon={faLayerGroup} className="mr-1" /> {t('economy.resources.slots')}</div>
                    <div className="value">{availSlots}</div>
                </ResourceStat>
                <ResourceStat>
                    <div className="label"><FontAwesomeIcon icon={faMicrochip} className="mr-1" /> {t('economy.resources.cpu')}</div>
                    <div className="value">{availCPU}%</div>
                </ResourceStat>
                <ResourceStat>
                    <div className="label"><FontAwesomeIcon icon={faMemory} className="mr-1" /> {t('economy.resources.ram')}</div>
                    <div className="value">{formatMB(availRAM)}</div>
                </ResourceStat>
                <ResourceStat>
                    <div className="label"><FontAwesomeIcon icon={faHdd} className="mr-1" /> {t('economy.resources.disk')}</div>
                    <div className="value">{formatMB(availDisk)}</div>
                </ResourceStat>
                <ResourceStat>
                    <div className="label"><FontAwesomeIcon icon={faLayerGroup} className="mr-1" /> {t('economy.resources.allocations')}</div>
                    <div className="value">{availAllocations}</div>
                </ResourceStat>
                <ResourceStat>
                    <div className="label"><FontAwesomeIcon icon={faLayerGroup} className="mr-1" /> {t('economy.resources.backups')}</div>
                    <div className="value">{availBackups}</div>
                </ResourceStat>
            </ResourceGrid>

            {availSlots <= 0 ? (
                <div className="bg-red-900/50 border border-red-500 text-red-100 p-4 rounded-lg mb-6">
                    {t('economy.create_server.no_slots')}
                </div>
            ) : (
                <Card>
                    <Formik
                        initialValues={{
                            name: '',
                            nest_id: resources.nests[0]?.id || '',
                            egg_id: resources.nests[0]?.eggs[0]?.id || '',
                            location_id: resources.locations[0]?.id || '',
                            node_id: resources.locations[0]?.nodes[0]?.id || '',
                            cpu: resources.min_limits.cpu,
                            ram: resources.min_limits.ram,
                            disk: resources.min_limits.disk,
                            allocations: 1,
                            backups: 0,
                            billing_cycle: 'monthly',
                        }}
                        onSubmit={submit}
                    >
                        {({ values, isSubmitting, setFieldValue }) => (
                            <Form>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-4">
                                        <div>
                                            <Label>{t('economy.create_server.server_name')}</Label>
                                            <Field name="name" as={Input} placeholder={t('economy.create_server.server_name_placeholder')} />
                                        </div>

                                        <div>
                                            <Label>{t('economy.create_server.nest')}</Label>
                                            <Select
                                                name="nest_id"
                                                value={values.nest_id}
                                                onChange={e => {
                                                    const nestId = parseInt(e.target.value);
                                                    setFieldValue('nest_id', nestId);
                                                    const nest = resources.nests.find(n => n.id === nestId);
                                                    if (nest?.eggs.length) {
                                                        setFieldValue('egg_id', nest.eggs[0].id);
                                                    }
                                                }}
                                            >
                                                {resources.nests.map(nest => (
                                                    <option key={nest.id} value={nest.id}>{nest.name}</option>
                                                ))}
                                            </Select>
                                        </div>

                                        <div>
                                            <Label>{t('economy.create_server.egg')}</Label>
                                            <Select name="egg_id">
                                                {resources.nests.find(n => n.id === parseInt(values.nest_id as any))?.eggs.map((egg: any) => (
                                                    <option key={egg.id} value={egg.id}>{egg.name}</option>
                                                ))}
                                            </Select>
                                        </div>

                                        <div>
                                            <Label>{t('economy.create_server.location')}</Label>
                                            <Select
                                                name="location_id"
                                                value={values.location_id}
                                                onChange={(e: React.ChangeEvent<HTMLSelectElement>) => {
                                                    const locId = parseInt(e.target.value);
                                                    setFieldValue('location_id', locId);
                                                    const loc = resources.locations.find((l: any) => l.id === locId);
                                                    if (loc?.nodes.length) {
                                                        setFieldValue('node_id', loc.nodes[0].id);
                                                    }
                                                }}
                                            >
                                                {resources.locations.map(loc => (
                                                    <option key={loc.id} value={loc.id}>{loc.long} ({loc.short})</option>
                                                ))}
                                            </Select>
                                        </div>

                                        <div>
                                            <Label>{t('economy.create_server.node')}</Label>
                                            <Select name="node_id">
                                                {resources.locations.find((l: any) => l.id === parseInt(values.location_id as any))?.nodes.map((node: any) => (
                                                    <option key={node.id} value={node.id}>{node.name}</option>
                                                ))}
                                            </Select>
                                        </div>
                                    </div>

                                    <div className="space-y-6">
                                        <div>
                                            <div className="flex justify-between mb-2">
                                                <Label>CPU 限制 (%)</Label>
                                                <span className="text-gray-400 text-sm">{values.cpu}% / {t('economy.create_server.max')} {availCPU}%</span>
                                            </div>
                                            <Field name="cpu" type="range" min={resources.min_limits.cpu} max={availCPU} step={10} className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-blue-500" />
                                            <div className="flex justify-between text-[10px] text-gray-500 mt-1">
                                                <span>最小: {resources.min_limits.cpu}%</span>
                                                <span>可用: {availCPU}%</span>
                                            </div>
                                        </div>

                                        <div>
                                            <div className="flex justify-between mb-2">
                                                <Label>記憶體限制 (MB)</Label>
                                                <span className="text-gray-400 text-sm">{values.ram} MB / {t('economy.create_server.max')} {availRAM} MB</span>
                                            </div>
                                            <Field name="ram" type="range" min={resources.min_limits.ram} max={availRAM} step={128} className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-blue-500" />
                                            <div className="flex justify-between text-[10px] text-gray-500 mt-1">
                                                <span>最小: {resources.min_limits.ram} MB</span>
                                                <span>可用: {availRAM} MB</span>
                                            </div>
                                        </div>

                                        <div>
                                            <div className="flex justify-between mb-2">
                                                <Label>磁碟限制 (MB)</Label>
                                                <span className="text-gray-400 text-sm">{values.disk} MB / {t('economy.create_server.max')} {availDisk} MB</span>
                                            </div>
                                            <Field name="disk" type="range" min={resources.min_limits.disk} max={availDisk} step={256} className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-blue-500" />
                                            <div className="flex justify-between text-[10px] text-gray-500 mt-1">
                                                <span>最小: {resources.min_limits.disk} MB</span>
                                                <span>可用: {availDisk} MB</span>
                                            </div>
                                        </div>

                                        <div>
                                            <div className="flex justify-between mb-2">
                                                <Label>網路埠口 (Port)</Label>
                                                <span className="text-gray-400 text-sm">{values.allocations} / {t('economy.create_server.max')} {availAllocations}</span>
                                            </div>
                                            <Field name="allocations" type="range" min={1} max={Math.max(1, availAllocations)} step={1} className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-blue-500" />
                                            <div className="flex justify-between text-[10px] text-gray-500 mt-1">
                                                <span>最小: 1</span>
                                                <span>可用: {availAllocations}</span>
                                            </div>
                                        </div>

                                        <div>
                                            <div className="flex justify-between mb-2">
                                                <Label>備份數量 (Backups)</Label>
                                                <span className="text-gray-400 text-sm">{values.backups} / {t('economy.create_server.max')} {availBackups}</span>
                                            </div>
                                            <Field name="backups" type="range" min={0} max={availBackups} step={1} className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-blue-500" />
                                            <div className="flex justify-between text-[10px] text-gray-500 mt-1">
                                                <span>最小: 0</span>
                                                <span>可用: {availBackups}</span>
                                            </div>
                                        </div>

                                        {economy.settings.billing?.enabled && (
                                            <div className="bg-blue-900/20 border border-blue-500/30 p-4 rounded-xl">
                                                <Label className="text-blue-400 mb-2 block">{t('economy.create_server.billing_estimate')}</Label>
                                                <div className="flex items-end gap-2">
                                                    <span className="text-3xl font-bold text-white">
                                                        {(
                                                            ((economy.settings.billing.base_price || 0) +
                                                                (values.cpu * (economy.settings.billing.cpu_coeff || 0)) +
                                                                (values.ram * (economy.settings.billing.ram_coeff || 0)) +
                                                                (values.disk * (economy.settings.billing.disk_coeff || 0))) *
                                                            (values.billing_cycle === 'hourly' ? (economy.settings.billing.hourly_multiplier || 1 / 720) :
                                                                values.billing_cycle === 'daily' ? (economy.settings.billing.daily_multiplier || 1 / 30) :
                                                                    values.billing_cycle === 'weekly' ? (economy.settings.billing.weekly_multiplier || 0.25) :
                                                                        (economy.settings.billing.monthly_multiplier || 1.0))
                                                        ).toFixed(2)}
                                                    </span>
                                                    <span className="text-gray-400 mb-1">{t('economy.points')}</span>
                                                </div>

                                                <div className="mt-4">
                                                    <Label>{t('economy.create_server.billing_cycle')}</Label>
                                                    <Field name="billing_cycle" as={Select}>
                                                        <option value="hourly">每小時扣 (Hourly)</option>
                                                        <option value="daily">每日扣 (Daily)</option>
                                                        <option value="weekly">每週扣 (Weekly)</option>
                                                        <option value="monthly">每月扣 (Monthly)</option>
                                                    </Field>
                                                </div>
                                            </div>
                                        )}

                                        <div className="pt-4 border-t border-gray-700">
                                            <Button type="submit" size="large" className="w-full" disabled={isSubmitting || !values.name || availSlots <= 0}>
                                                <FontAwesomeIcon icon={faServer} className="mr-2" /> {t('economy.create_server.submit')}
                                            </Button>
                                            <p className="text-[10px] text-gray-400 mt-2 text-center">
                                                {t('economy.create_server.footer_text')}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </Form>
                        )}
                    </Formik>
                </Card>
            )}
        </ContentBox>
    );
};

const Card = styled.div`
    background: #111827;
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: 1rem;
    padding: 2rem;
`;

export default CreateServerContainer;
