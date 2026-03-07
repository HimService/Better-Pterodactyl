import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTrashAlt, faSave, faClock, faInfoCircle } from '@fortawesome/free-solid-svg-icons';
import Switch from '@/components/elements/Switch';
import { useTranslation } from 'react-i18next';
import Spinner from '@/components/elements/Spinner';

const GlassCard = styled.div`
    background: rgba(17, 24, 39, 0.7);
    backdrop-filter: blur(12px);
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: 1.5rem;
    padding: 2.5rem;
    box-shadow: 0 20px 50px rgba(0, 0, 0, 0.3);
    margin-bottom: 2rem;
`;

const PremiumButton = styled.button`
    padding: 0.875rem 1.5rem;
    background: linear-gradient(135deg, #8b5cf6 0%, #6366f1 100%);
    color: #fff;
    border: none;
    border-radius: 0.875rem;
    font-weight: 700;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.625rem;
    transition: all 0.2s ease;

    &:hover:not(:disabled) {
        transform: translateY(-2px);
        box-shadow: 0 8px 20px rgba(139, 92, 246, 0.3);
    }

    &:disabled {
        opacity: 0.5;
        cursor: not-allowed;
    }
`;

const Input = styled.input`
    width: 100%;
    background: rgba(31, 41, 55, 0.5);
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: 0.75rem;
    padding: 0.75rem 1rem;
    color: white;
    outline: none;
    transition: border-color 0.2s;

    &:focus {
        border-color: #8b5cf6;
    }
`;

const TrashManager = () => {
    const { t } = useTranslation();
    const [settings, setSettings] = useState({ enabled: true, retention_days: 30 });
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        fetch('/admin/trash/settings')
            .then(res => res.json())
            .then(data => {
                setSettings(data);
                setLoading(false);
            })
            .catch(err => console.error(err));
    }, []);

    const handleSave = async () => {
        setSaving(true);
        try {
            const response = await fetch('/admin/trash/settings', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': (document.querySelector('meta[name="_token"]') as any)?.content || ''
                },
                body: JSON.stringify(settings),
            });

            if (response.ok) {
                // @ts-ignore
                window.swal({ title: t('admin.trash.save_success', 'Recycle System settings saved!'), type: 'success', timer: 1500 });
            }
        } catch (err) {
            console.error(err);
        } finally {
            setSaving(false);
        }
    };

    if (loading) return (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '5rem' }}>
            <Spinner size="large" />
        </div>
    );

    return (
        <div style={{ padding: '2rem' }}>
            <div style={{ marginBottom: '2rem' }}>
                <h2 style={{ color: 'white', fontSize: '2.25rem', fontWeight: 800 }}>
                    <FontAwesomeIcon icon={faTrashAlt} style={{ marginRight: '1rem', color: '#ef4444' }} />
                    {t('admin.trash.header', 'Recycle System')}
                </h2>
                <p style={{ color: '#9ca3af', marginTop: '0.5rem' }}>
                    {t('admin.trash.header_desc', 'Configure file soft-deletion and automated cleanup policies.')}
                </p>
            </div>

            <GlassCard>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '2.5rem' }}>
                    <div style={{
                        width: '3.5rem', height: '3.5rem',
                        background: 'rgba(239, 68, 68, 0.1)',
                        borderRadius: '1rem', display: 'flex', alignItems: 'center',
                        justifyContent: 'center', color: '#ef4444'
                    }}>
                        <FontAwesomeIcon icon={faInfoCircle} size="lg" />
                    </div>
                    <div>
                        <h3 style={{ color: 'white', fontSize: '1.5rem', fontWeight: 700 }}>{t('admin.trash.overviewTitle', 'Core Configuration')}</h3>
                        <p style={{ color: '#9ca3af', fontSize: '0.875rem' }}>{t('admin.trash.overviewDesc', 'Enable/disable the trash system and set retention rules.')}</p>
                    </div>
                </div>

                <div style={{ display: 'grid', gap: '2rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'rgba(31, 41, 55, 0.3)', padding: '2rem', borderRadius: '1.25rem', border: '1px solid rgba(255,255,255,0.05)' }}>
                        <div style={{ flex: 1 }}>
                            <h4 style={{ color: 'white', fontWeight: 600, fontSize: '1.1rem' }}>{t('admin.trash.enable', 'Enable Recycle System')}</h4>
                            <p style={{ color: '#6b7280', fontSize: '0.9rem', marginTop: '0.25rem' }}>{t('admin.trash.enable_help', 'Recommended. Files will be moved to hidden storage instead of immediate deletion.')}</p>
                        </div>
                        <Switch
                            name="trash_enabled"
                            checked={settings.enabled}
                            onChange={() => setSettings({ ...settings, enabled: !settings.enabled })}
                        />
                    </div>

                    <div style={{ background: 'rgba(31, 41, 55, 0.3)', padding: '2rem', borderRadius: '1.25rem', border: '1px solid rgba(255,255,255,0.05)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.25rem' }}>
                            <FontAwesomeIcon icon={faClock} style={{ color: '#8b5cf6' }} />
                            <h4 style={{ color: 'white', fontWeight: 600, fontSize: '1.1rem' }}>{t('admin.trash.retention', 'Global Retention Period (Days)')}</h4>
                        </div>
                        <div style={{ maxWidth: '240px' }}>
                            <Input
                                type="number"
                                value={settings.retention_days}
                                onChange={(e) => setSettings({ ...settings, retention_days: parseInt(e.target.value) || 0 })}
                                min={0}
                                max={365}
                            />
                        </div>
                        <p style={{ color: '#6b7280', fontSize: '0.9rem', marginTop: '0.75rem' }}>
                            {t('admin.trash.retention_help', 'Specifies how long files stay in the trash before being permanently purged by the system cron.')}
                        </p>
                    </div>
                </div>

                <div style={{ marginTop: '3rem', display: 'flex', justifyContent: 'flex-end', borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '2rem' }}>
                    <PremiumButton onClick={handleSave} disabled={saving}>
                        <FontAwesomeIcon icon={faSave} />
                        {saving ? t('admin.trash.saving', 'Saving Config...') : t('admin.trash.save', 'Update Settings')}
                    </PremiumButton>
                </div>
            </GlassCard>

            <div style={{ background: 'rgba(239, 68, 68, 0.05)', borderLeft: '4px solid #ef4444', padding: '1.5rem', borderRadius: '0.5rem' }}>
                <h4 style={{ color: '#ef4444', fontWeight: 700, marginBottom: '0.5rem' }}>
                    <FontAwesomeIcon icon={faInfoCircle} style={{ marginRight: '0.5rem' }} />
                    {t('admin.trash.notice', 'System Notice')}
                </h4>
                <p style={{ color: '#d1d5db', fontSize: '0.9rem' }}>
                    {t('admin.trash.notice_body', 'Files in the recycle system still consume disk space under the user\'s allocated quota. Soft-deleted files are stored in .bp_trash at the server root.')}
                </p>
            </div>
        </div>
    );
};

export default TrashManager;
