import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTrashAlt, faSave, faClock } from '@fortawesome/free-solid-svg-icons';
import Switch from '@/components/elements/Switch';
import { useTranslation } from 'react-i18next';

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

const TrashSettings = () => {
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
                (window as any).swal({ title: t('plugins.save_success'), type: 'success', timer: 1500 });
            }
        } catch (err) {
            console.error(err);
        } finally {
            setSaving(false);
        }
    };

    if (loading) return null;

    return (
        <GlassCard>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '2rem' }}>
                <div style={{
                    width: '3.5rem', height: '3.5rem',
                    background: 'rgba(239, 68, 68, 0.1)',
                    borderRadius: '1rem', display: 'flex', alignItems: 'center',
                    justifyContent: 'center', color: '#ef4444'
                }}>
                    <FontAwesomeIcon icon={faTrashAlt} size="lg" />
                </div>
                <div>
                    <h3 style={{ color: 'white', fontSize: '1.5rem', fontWeight: 700 }}>{t('admin.trash.title', 'Trash Can System')}</h3>
                    <p style={{ color: '#9ca3af', fontSize: '0.875rem' }}>{t('admin.trash.description', 'Manage file soft-deletion and automatic cleanup.')}</p>
                </div>
            </div>

            <div style={{ display: 'grid', gap: '2rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyBetween: 'space-between', background: 'rgba(31, 41, 55, 0.3)', padding: '1.5rem', borderRadius: '1rem' }}>
                    <div style={{ flex: 1 }}>
                        <h4 style={{ color: 'white', fontWeight: 600 }}>{t('admin.trash.enable', 'Enable Trash Can')}</h4>
                        <p style={{ color: '#6b7280', fontSize: '0.8rem' }}>{t('admin.trash.enable_help', 'If enabled, deleted files will be moved to .bp_trash instead of being permanently removed.')}</p>
                    </div>
                    <Switch
                        name="trash_enabled"
                        checked={settings.enabled}
                        onChange={() => setSettings({ ...settings, enabled: !settings.enabled })}
                    />
                </div>

                <div style={{ background: 'rgba(31, 41, 55, 0.3)', padding: '1.5rem', borderRadius: '1rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
                        <FontAwesomeIcon icon={faClock} style={{ color: '#8b5cf6' }} />
                        <h4 style={{ color: 'white', fontWeight: 600 }}>{t('admin.trash.retention', 'Retention Period (Days)')}</h4>
                    </div>
                    <div style={{ maxWidth: '200px' }}>
                        <Input
                            type="number"
                            value={settings.retention_days}
                            onChange={(e) => setSettings({ ...settings, retention_days: parseInt(e.target.value) || 0 })}
                            min={0}
                            max={365}
                        />
                    </div>
                    <p style={{ color: '#6b7280', fontSize: '0.8rem', marginTop: '0.5rem' }}>
                        {t('admin.trash.retention_help', 'Files older than this will be permanently deleted by the system cron.')}
                    </p>
                </div>
            </div>

            <div style={{ marginTop: '2.5rem', display: 'flex', justifyContent: 'flex-end' }}>
                <PremiumButton onClick={handleSave} disabled={saving}>
                    <FontAwesomeIcon icon={faSave} />
                    {saving ? t('admin.trash.saving', 'Saving...') : t('admin.trash.save', 'Save Trash Settings')}
                </PremiumButton>
            </div>
        </GlassCard>
    );
};

export default TrashSettings;
