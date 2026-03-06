import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faServer, faCheckCircle, faSave, faTimesCircle, faEye, faEyeSlash, faVial } from '@fortawesome/free-solid-svg-icons';
import { useTranslation } from 'react-i18next';
import Switch from '@/components/elements/Switch';

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

const NodeRow = styled.div<{ $visible: boolean }>`
    background-color: #1f2937;
    border: 1px solid ${props => props.$visible ? 'rgba(16, 185, 129, 0.5)' : 'rgba(255, 255, 255, 0.05)'};
    box-shadow: ${props => props.$visible ? '0 0 15px rgba(16, 185, 129, 0.1)' : 'none'};
    border-radius: 1rem;
    padding: 1.25rem 1.5rem;
    margin-bottom: 1rem;
    display: flex;
    align-items: center;
    justify-content: space-between;
    transition: all 0.3s ease;

    &:last-child {
        margin-bottom: 0;
    }
`;

interface NodeStatus {
    id: number;
    name: string;
    location: string;
    public: boolean;
}

const StatusManager = () => {
    const { t } = useTranslation();
    const [nodes, setNodes] = useState<NodeStatus[]>([]);
    const [webhookUrl, setWebhookUrl] = useState('');
    const [alertsEnabled, setAlertsEnabled] = useState(false);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');
    const [testing, setTesting] = useState(false);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);

    useEffect(() => {
        fetch('/admin/status/nodes')
            .then(res => res.json())
            .then(data => {
                if (data.nodes) {
                    setNodes(data.nodes);
                    setWebhookUrl(data.webhook_url || '');
                    setAlertsEnabled(data.alerts_enabled || false);
                } else if (Array.isArray(data)) {
                    setNodes(data);
                }
            })
            .catch(console.error)
            .finally(() => setLoading(false));
    }, []);

    const handleToggle = (id: number, visible: boolean) => {
        setNodes(nodes.map(n => n.id === id ? { ...n, public: visible } : n));
    };

    const handleTestWebhook = async () => {
        if (!webhookUrl) return;
        setTesting(true);
        try {
            const response = await fetch('/admin/status/test', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': (document.querySelector('meta[name="_token"]') as any)?.content || ''
                },
                body: JSON.stringify({ webhook_url: webhookUrl }),
            });
            const data = await response.json();
            if (response.ok) {
                (window as any).swal({
                    title: '發送成功',
                    text: '測試通知已發送！請檢查您的 Webhook 頻道。',
                    type: 'success'
                });
            } else {
                (window as any).swal({
                    title: '發送失敗',
                    text: data.error || '不明錯誤',
                    type: 'error'
                });
            }
        } catch (err: any) {
            (window as any).swal({
                title: '發生錯誤',
                text: err.message,
                type: 'error'
            });
        } finally {
            setTesting(false);
        }
    };

    const handleSave = async () => {
        setSaving(true);
        setStatus('idle');
        try {
            const visibleNodeIds = nodes.filter(n => n.public).map(n => n.id);
            const payload = {
                nodes: visibleNodeIds,
                webhook_url: webhookUrl,
                alerts_enabled: alertsEnabled
            };

            const response = await fetch('/admin/status', {
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
                    text: '狀態頁面設定已更新。',
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
            setErrorMessage(err.message || '發生預期外的錯誤。');
        } finally {
            setSaving(false);
        }
    };

    return (
        <Container>
            <Header>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <div style={{ width: '3rem', height: '3rem', backgroundColor: 'rgba(59, 130, 246, 0.2)', borderRadius: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#3b82f6' }}>
                        <FontAwesomeIcon icon={faServer} size="lg" />
                    </div>
                    <div>
                        <h2 style={{ fontSize: '1.5rem', fontWeight: 700, color: 'white', lineHeight: 1, marginBottom: '0.25rem' }}>狀態頁面設定</h2>
                        <p style={{ color: '#9ca3af', fontSize: '0.875rem' }}>管理顯示在公共狀態頁面的節點</p>
                    </div>
                </div>
            </Header>

            {loading ? (
                <Card style={{ textAlign: 'center', padding: '4rem 2rem', color: '#9ca3af' }}>
                    <p>載入中...</p>
                </Card>
            ) : nodes.length === 0 ? (
                <Card style={{ textAlign: 'center', padding: '4rem 2rem', color: '#9ca3af' }}>
                    <p>目前沒有任何節點。</p>
                </Card>
            ) : (
                <Card>
                    <div style={{ marginBottom: '1.5rem', paddingBottom: '1rem', borderBottom: '1px solid rgba(255, 255, 255, 0.05)', display: 'flex', justifyContent: 'space-between', color: '#9ca3af', fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                        <span>節點名稱</span>
                        <span>顯示狀態</span>
                    </div>
                    {nodes.map((node) => (
                        <NodeRow key={node.id} $visible={node.public}>
                            <div style={{ display: 'flex', flexDirection: 'column' }}>
                                <span style={{ color: 'white', fontWeight: 600, fontSize: '1rem' }}>{node.name}</span>
                                <span style={{ color: '#9ca3af', fontSize: '0.75rem' }}>{node.location} (ID: {node.id})</span>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: node.public ? '#10b981' : '#6b7280', fontSize: '0.875rem', fontWeight: 500 }}>
                                    <FontAwesomeIcon icon={node.public ? faEye : faEyeSlash} />
                                    {node.public ? '顯示中' : '已隱藏'}
                                </div>
                                <Switch
                                    name={`node-${node.id}`}
                                    checked={node.public}
                                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleToggle(node.id, e.target.checked)}
                                />
                            </div>
                        </NodeRow>
                    ))}
                </Card>
            )}

            <Card>
                <h3 style={{ color: 'white', fontSize: '1.25rem', fontWeight: 700, marginBottom: '1rem' }}>故障通知 (Webhook)</h3>
                <p style={{ color: '#9ca3af', fontSize: '0.875rem', marginBottom: '1.5rem' }}>當節點離線時，自動發送通知到 Discord 或 Telegram。</p>

                <div style={{ marginBottom: '1.5rem' }}>
                    <label style={{ display: 'block', color: '#9ca3af', fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', marginBottom: '0.5rem' }}>Webhook URL</label>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <input
                            type="text"
                            value={webhookUrl}
                            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setWebhookUrl(e.target.value)}
                            placeholder="https://discord.com/api/webhooks/..."
                            style={{ flex: 1, backgroundColor: '#1f2937', border: '1px solid rgba(255, 255, 255, 0.1)', borderRadius: '0.75rem', padding: '0.75rem 1rem', color: 'white', outline: 'none' }}
                        />
                        <button
                            type="button"
                            onClick={handleTestWebhook}
                            disabled={testing || !webhookUrl}
                            style={{
                                padding: '0 1.5rem',
                                backgroundColor: '#4b5563',
                                color: 'white',
                                border: 'none',
                                borderRadius: '0.75rem',
                                cursor: (testing || !webhookUrl) ? 'not-allowed' : 'pointer',
                                fontSize: '0.875rem',
                                fontWeight: 600,
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.5rem',
                                transition: 'background-color 0.2s',
                                opacity: testing ? 0.7 : 1
                            }}
                        >
                            <FontAwesomeIcon icon={faVial} spin={testing} />
                            {testing ? '測試中' : '測試發送'}
                        </button>
                    </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#1f2937', padding: '1rem', borderRadius: '1rem' }}>
                    <div>
                        <span style={{ color: 'white', fontWeight: 600, display: 'block' }}>啟用故障通知</span>
                        <span style={{ color: '#9ca3af', fontSize: '0.75rem' }}>切換是否在節點斷線時發送通知</span>
                    </div>
                    <Switch
                        name="alerts_enabled"
                        checked={alertsEnabled}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setAlertsEnabled(e.target.checked)}
                    />
                </div>
            </Card>

            <div style={{ position: 'fixed', bottom: '2rem', right: '2rem', zIndex: 9999 }}>
                <button
                    onClick={handleSave}
                    disabled={saving || loading}
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
                        cursor: (saving || loading) ? 'not-allowed' : 'pointer',
                        backgroundColor: status === 'success' ? '#059669' : (status === 'error' ? '#dc2626' : '#3b82f6'),
                        color: 'white',
                        boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.5)',
                        opacity: (saving || loading) ? 0.7 : 1
                    }}
                >
                    <FontAwesomeIcon icon={saving ? faSave : (status === 'success' ? faCheckCircle : (status === 'error' ? faTimesCircle : faSave))} spin={saving} />
                    {saving ? '儲存中...' : (status === 'success' ? '儲存成功' : (status === 'error' ? (errorMessage || '儲存失敗') : '儲存設定'))}
                </button>
            </div>
        </Container>
    );
};

export default StatusManager;
