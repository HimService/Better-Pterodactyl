import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faBullhorn, faCheckCircle, faSave, faTimesCircle, faPlus, faTrash } from '@fortawesome/free-solid-svg-icons';
import { useTranslation } from 'react-i18next';
import Switch from '@/components/elements/Switch';
import classNames from 'classnames';

const Container = styled.div`
    max-width: 48rem;
    margin: 2rem auto;
`;

const Card = styled.div`
    background-color: #111827;
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: 1.5rem;
    padding: 2rem;
    box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.5);
    margin-bottom: 2rem;
`;

const Header = styled.div`
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 2rem;
`;

const AnnouncementCard = styled.div<{ $enabled: boolean }>`
    background-color: #1f2937;
    border: 1px solid ${props => props.$enabled ? 'rgba(16, 185, 129, 0.5)' : 'rgba(255, 255, 255, 0.05)'};
    box-shadow: ${props => props.$enabled ? '0 0 15px rgba(16, 185, 129, 0.1)' : 'none'};
    border-radius: 1rem;
    padding: 1.5rem;
    margin-bottom: 1.5rem;
    position: relative;
    transition: all 0.3s ease;
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
    margin-bottom: 1.5rem;
    outline: none;
    transition: all 0.2s;
    &:focus { border-color: #6366f1; }
`;

const Select = styled.select`
    width: 100%;
    background-color: #374151;
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: 0.75rem;
    padding: 0.75rem 1rem;
    color: white;
    margin-bottom: 1.5rem;
    appearance: none;
    outline: none;
    &:focus { border-color: #6366f1; }
`;

const TextArea = styled.textarea`
    width: 100%;
    background-color: rgba(255, 255, 255, 0.05);
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: 0.75rem;
    padding: 0.75rem 1rem;
    color: white;
    margin-bottom: 1.5rem;
    height: 6rem;
    resize: none;
    outline: none;
    &:focus { border-color: #6366f1; }
`;

const DeleteButton = styled.button`
    position: absolute;
    top: 1rem;
    right: 1rem;
    background: transparent;
    border: none;
    color: #ef4444;
    cursor: pointer;
    font-size: 1.25rem;
    opacity: 0.7;
    transition: all 0.2s;
    &:hover { opacity: 1; transform: scale(1.1); }
`;

interface Announcement {
    id: string;
    enabled: boolean;
    type: 'info' | 'warning' | 'danger' | 'success';
    message: string;
    link: string;
    updated_at?: string;
}

const generateId = () => Math.random().toString(36).substr(2, 9);

const AnnouncementManager = () => {
    const { t } = useTranslation();
    const [announcements, setAnnouncements] = useState<Announcement[]>([]);
    const [loading, setLoading] = useState(false);
    const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');
    const [errorMessage, setErrorMessage] = useState<string | null>(null);

    useEffect(() => {
        // Fetch existing announcements on mount
        fetch('/api/public/announcements?t=' + Date.now())
            .then(res => res.json())
            .then(data => {
                if (Array.isArray(data)) {
                    setAnnouncements(data);
                } else if (data && typeof data === 'object' && Object.keys(data).length > 0) {
                    // Legacy migration from single object to array
                    setAnnouncements([{ ...data, id: generateId() }]);
                }
            })
            .catch(() => null);
    }, []);

    const handleAdd = () => {
        setAnnouncements([
            {
                id: generateId(),
                enabled: false,
                type: 'info',
                message: '',
                link: ''
            },
            ...announcements
        ]);
    };

    const handleUpdate = (id: string, field: keyof Announcement, value: any) => {
        setAnnouncements(announcements.map(a =>
            a.id === id ? { ...a, [field]: value } : a
        ));
    };

    const handleDelete = (id: string) => {
        setAnnouncements(announcements.filter(a => a.id !== id));
    };

    const handleSave = async () => {
        // Validation: enforce message being non-empty for enabled announcements
        const invalid = announcements.find(a => a.enabled && !a.message.trim());
        if (invalid) {
            (window as any).swal({
                title: '驗證失敗',
                text: '啟用的公告內容不能為空。',
                type: 'error'
            });
            return;
        }

        setLoading(true);
        setStatus('idle');
        try {
            const payload = announcements.map(a => ({ ...a, updated_at: new Date().toISOString() }));

            const response = await fetch('/admin/announcements', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': (document.querySelector('meta[name="_token"]') as any)?.content || ''
                },
                body: JSON.stringify(payload),
            });

            if (response.ok) {
                setStatus('success');
                setErrorMessage(null);
                (window as any).swal({
                    title: '儲存成功',
                    text: '公告設定已更新。',
                    type: 'success'
                });
                setTimeout(() => setStatus('idle'), 3000);
            } else {
                const data = await response.json().catch(() => ({}));
                setStatus('error');
                setErrorMessage(data.error || '儲存時發生伺服器錯誤。');
                (window as any).swal({
                    title: '儲存失敗',
                    text: data.error || '儲存時發生伺服器錯誤。',
                    type: 'error'
                });
            }
        } catch (err: any) {
            console.error(err);
            setStatus('error');
            setErrorMessage(err.message || 'An unexpected error occurred.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Container>
            <Header>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <div style={{ width: '3rem', height: '3rem', backgroundColor: 'rgba(99, 102, 241, 0.2)', borderRadius: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#6366f1' }}>
                        <FontAwesomeIcon icon={faBullhorn} size="lg" />
                    </div>
                    <div>
                        <h2 style={{ fontSize: '1.5rem', fontWeight: 700, color: 'white', lineHeight: 1, marginBottom: '0.25rem' }}>{t('admin.announcements.title')}</h2>
                        <p style={{ color: '#9ca3af', fontSize: '0.875rem' }}>{t('admin.announcements.subtitle')}</p>
                    </div>
                </div>
                <button
                    onClick={handleAdd}
                    style={{
                        padding: '0.75rem 1.5rem',
                        borderRadius: '0.75rem',
                        fontWeight: 700,
                        backgroundColor: '#374151',
                        color: 'white',
                        border: 'none',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem',
                        transition: 'background-color 0.2s'
                    }}
                    onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#4b5563'}
                    onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#374151'}
                >
                    <FontAwesomeIcon icon={faPlus} />
                    {t('admin.announcements.add_button', '新增公告')}
                </button>
            </Header>

            {announcements.length === 0 ? (
                <Card style={{ textAlign: 'center', padding: '4rem 2rem', color: '#9ca3af' }}>
                    <FontAwesomeIcon icon={faBullhorn} size="3x" style={{ opacity: 0.2, marginBottom: '1rem' }} />
                    <p style={{ fontSize: '1.125rem' }}>{t('admin.announcements.empty_message', '目前沒有公告。點擊右上角新增一個吧！')}</p>
                </Card>
            ) : (
                <Card>
                    {announcements.map((announcement, index) => (
                        <AnnouncementCard key={announcement.id} $enabled={announcement.enabled}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem', paddingBottom: '1rem', borderBottom: '1px solid rgba(255, 255, 255, 0.05)' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                    <Switch
                                        name={`enabled-${announcement.id}`}
                                        defaultChecked={announcement.enabled}
                                        onChange={(e) => handleUpdate(announcement.id, 'enabled', e.target.checked)}
                                    />
                                    <div>
                                        <div style={{ fontWeight: 700, color: 'white', fontSize: '1.1rem' }}>
                                            {announcement.enabled ? t('admin.announcements.active', '已啟用 (Active)') : t('admin.announcements.inactive', '未啟用 (Inactive)')}
                                        </div>
                                        <div style={{ fontSize: '0.75rem', color: announcement.enabled ? '#10b981' : '#6b7280' }}>
                                            {announcement.enabled ? t('admin.announcements.status_active', '此公告目前顯示中') : t('admin.announcements.status_inactive', '此公告已隱藏')}
                                        </div>
                                    </div>
                                </div>
                                <button
                                    onClick={() => handleDelete(announcement.id)}
                                    title={t('global.delete', '刪除')}
                                    style={{ background: 'transparent', border: 'none', color: '#ef4444', cursor: 'pointer', opacity: 0.7, padding: '0.5rem', transition: 'all 0.2s', borderRadius: '0.5rem' }}
                                    onMouseEnter={e => { e.currentTarget.style.opacity = '1'; e.currentTarget.style.backgroundColor = 'rgba(239, 68, 68, 0.1)'; }}
                                    onMouseLeave={e => { e.currentTarget.style.opacity = '0.7'; e.currentTarget.style.backgroundColor = 'transparent'; }}
                                >
                                    <FontAwesomeIcon icon={faTrash} size="lg" />
                                </button>
                            </div>

                            <div style={{ display: 'flex', gap: '1.5rem', flexDirection: 'column' }}>
                                <div style={{ display: 'flex', gap: '1rem' }}>
                                    <div style={{ flex: 1 }}>
                                        <Label>{t('admin.announcements.type_label')}</Label>
                                        <Select style={{ marginBottom: 0 }} value={announcement.type} onChange={(e) => handleUpdate(announcement.id, 'type', e.target.value)}>
                                            <option value="info">{t('admin.announcements.types.info')}</option>
                                            <option value="warning">{t('admin.announcements.types.warning')}</option>
                                            <option value="danger">{t('admin.announcements.types.danger')}</option>
                                            <option value="success">{t('admin.announcements.types.success')}</option>
                                        </Select>
                                    </div>
                                    <div style={{ flex: 2 }}>
                                        <Label>{t('admin.announcements.link_label')} (選填)</Label>
                                        <Input
                                            style={{ marginBottom: 0 }}
                                            type="text"
                                            placeholder="https://..."
                                            value={announcement.link}
                                            onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleUpdate(announcement.id, 'link', e.target.value)}
                                        />
                                    </div>
                                </div>

                                <div>
                                    <Label>{t('admin.announcements.message_label')}</Label>
                                    <TextArea
                                        placeholder={t('admin.announcements.message_placeholder', '輸入公告內容...')}
                                        value={announcement.message}
                                        onChange={(e) => handleUpdate(announcement.id, 'message', e.target.value)}
                                        style={{ marginBottom: 0, minHeight: '8rem' }}
                                    />
                                </div>
                            </div>
                        </AnnouncementCard>
                    ))}
                </Card>
            )}

            <div style={{ position: 'fixed', bottom: '2rem', right: '2rem', zIndex: 9999 }}>
                <button
                    onClick={handleSave}
                    disabled={loading}
                    style={{
                        padding: '1rem 2rem',
                        borderRadius: '1rem',
                        fontWeight: 700,
                        fontSize: '1.125rem',
                        transition: 'all 0.2s',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '0.75rem',
                        border: 'none',
                        cursor: loading ? 'not-allowed' : 'pointer',
                        backgroundColor: status === 'success' ? '#059669' : (status === 'error' ? '#dc2626' : '#4f46e5'),
                        color: 'white',
                        boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.5)',
                        opacity: loading ? 0.7 : 1
                    }}
                >
                    <FontAwesomeIcon icon={loading ? faSave : (status === 'success' ? faCheckCircle : (status === 'error' ? faTimesCircle : faSave))} spin={loading} />
                    {loading ? t('admin.announcements.saving') : (status === 'success' ? t('admin.announcements.success_message') : (status === 'error' ? (errorMessage || t('admin.announcements.error_message')) : t('admin.announcements.save_button')))}
                </button>
            </div>
        </Container>
    );
};

export default AnnouncementManager;
