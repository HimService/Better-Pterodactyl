import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faServer, faCheckCircle, faSave, faTimesCircle, faEye, faEyeSlash } from '@fortawesome/free-solid-svg-icons';
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
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');
    const [errorMessage, setErrorMessage] = useState<string | null>(null);

    useEffect(() => {
        fetch('/admin/status/nodes')
            .then(res => res.json())
            .then(data => {
                if (Array.isArray(data)) {
                    setNodes(data);
                }
            })
            .catch(console.error)
            .finally(() => setLoading(false));
    }, []);

    const handleToggle = (id: number, visible: boolean) => {
        setNodes(nodes.map(n => n.id === id ? { ...n, public: visible } : n));
    };

    const handleSave = async () => {
        setSaving(true);
        setStatus('idle');
        try {
            // We save the list of VISIBLE node IDs
            const visibleNodeIds = nodes.filter(n => n.public).map(n => n.id);

            const response = await fetch('/admin/status', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': (document.querySelector('meta[name="_token"]') as any)?.content || ''
                },
                body: JSON.stringify(visibleNodeIds),
            });

            if (response.ok) {
                setStatus('success');
                setErrorMessage(null);
                setTimeout(() => setStatus('idle'), 3000);
            } else {
                const data = await response.json().catch(() => ({}));
                setStatus('error');
                setErrorMessage(data.error || '儲存時發生伺服器錯誤。');
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
                                    defaultChecked={node.public}
                                    onChange={(e) => handleToggle(node.id, e.target.checked)}
                                />
                            </div>
                        </NodeRow>
                    ))}
                </Card>
            )}

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
