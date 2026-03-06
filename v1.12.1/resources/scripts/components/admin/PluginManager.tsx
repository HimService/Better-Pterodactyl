import React, { useState, useEffect, useCallback } from 'react';
import styled, { keyframes } from 'styled-components';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
    faPuzzlePiece,
    faPlus,
    faTrash,
    faCloudUploadAlt,
    faCogs,
    faMagic,
    faCheckCircle,
} from '@fortawesome/free-solid-svg-icons';
import Switch from '@/components/elements/Switch';
import { useTranslation } from 'react-i18next';

const fadeIn = keyframes`
    from { opacity: 0; transform: translateY(10px); }
    to { opacity: 1; transform: translateY(0); }
`;

const Container = styled.div`
    max-width: 70rem;
    margin: 2rem auto;
    padding: 0 1rem;
    animation: ${fadeIn} 0.5s ease-out;
`;

const GlassCard = styled.div`
    background: rgba(17, 24, 39, 0.7);
    backdrop-filter: blur(12px);
    -webkit-backdrop-filter: blur(12px);
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: 1.5rem;
    padding: 2.5rem;
    box-shadow: 0 20px 50px rgba(0, 0, 0, 0.3);
    margin-bottom: 2rem;
    transition: transform 0.3s ease, border-color 0.3s ease;

    &:hover {
        border-color: rgba(139, 92, 246, 0.3);
    }
`;

const Header = styled.div`
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 3rem;
`;

const TitleGradient = styled.h2`
    font-size: 2.5rem;
    font-weight: 800;
    background: linear-gradient(135deg, #fff 0%, #8b5cf6 100%);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    margin-bottom: 0.5rem;
`;

const PluginRow = styled.div<{ $enabled: boolean }>`
    background: rgba(31, 41, 55, 0.5);
    border: 1px solid ${props => props.$enabled ? 'rgba(139, 92, 246, 0.4)' : 'rgba(255, 255, 255, 0.05)'};
    backdrop-filter: blur(4px);
    border-radius: 1.25rem;
    padding: 1.5rem;
    margin-bottom: 1rem;
    display: flex;
    align-items: center;
    justify-content: space-between;
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    animation: ${fadeIn} 0.4s ease-out backwards;

    &:hover {
        background: rgba(31, 41, 55, 0.8);
        transform: scale(1.01) translateX(5px);
        border-color: rgba(139, 92, 246, 0.6);
        box-shadow: 0 10px 20px rgba(0, 0, 0, 0.2);
    }
`;

const JsonTextArea = styled.textarea`
    width: 100%;
    height: 200px;
    background: rgba(17, 24, 39, 0.8);
    border: 1px solid rgba(139, 92, 246, 0.2);
    border-radius: 1rem;
    padding: 1.25rem;
    color: #a5b4fc;
    font-family: 'Fira Code', 'Courier New', monospace;
    font-size: 0.9rem;
    outline: none;
    transition: all 0.3s ease;
    resize: vertical;

    &:focus {
        border-color: #8b5cf6;
        box-shadow: 0 0 0 4px rgba(139, 92, 246, 0.1);
    }

    &::placeholder {
        color: rgba(255, 255, 255, 0.2);
    }
`;

const PremiumButton = styled.button<{ $variant?: 'primary' | 'danger' }>`
    padding: 0.875rem 1.5rem;
    background: ${props => props.$variant === 'danger' ? 'rgba(239, 68, 68, 0.1)' : 'linear-gradient(135deg, #8b5cf6 0%, #6366f1 100%)'};
    color: ${props => props.$variant === 'danger' ? '#ef4444' : '#fff'};
    border: 1px solid ${props => props.$variant === 'danger' ? '#ef4444' : 'transparent'};
    border-radius: 0.875rem;
    font-weight: 700;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.625rem;
    transition: all 0.2s ease;
    text-transform: uppercase;
    letter-spacing: 0.025em;

    &:hover:not(:disabled) {
        transform: translateY(-2px);
        box-shadow: 0 8px 20px ${props => props.$variant === 'danger' ? 'rgba(239, 68, 68, 0.2)' : 'rgba(139, 92, 246, 0.3)'};
        filter: brightness(1.1);
    }

    &:active:not(:disabled) {
        transform: translateY(0);
    }

    &:disabled {
        opacity: 0.5;
        cursor: not-allowed;
    }
`;

const Badge = styled.span`
    font-size: 0.7rem;
    font-weight: 700;
    padding: 0.25rem 0.75rem;
    border-radius: 2rem;
    background: rgba(139, 92, 246, 0.15);
    color: #c4b5fd;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    border: 1px solid rgba(139, 92, 246, 0.3);
`;

interface Plugin {
    id: number;
    name: string;
    description: string;
    slot: string;
    type: string;
    enabled: boolean;
    config: string;
}

const PluginManager = () => {
    const { t } = useTranslation();
    const [plugins, setPlugins] = useState<Plugin[]>([]);
    const [jsonInput, setJsonInput] = useState('');
    const [loading, setLoading] = useState(true);
    const [installing, setInstalling] = useState(false);
    const [dragActive, setDragActive] = useState(false);

    const refreshPlugins = useCallback(async () => {
        setLoading(true);
        try {
            const res = await fetch('/admin/plugins/list');
            const data = await res.json();
            setPlugins(data);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        refreshPlugins();
    }, [refreshPlugins]);

    const handleInstall = async () => {
        if (!jsonInput.trim()) return;
        setInstalling(true);
        try {
            let config;
            try {
                config = JSON.parse(jsonInput);
            } catch (e) {
                throw new Error(t('plugins.json_error'));
            }

            const response = await fetch('/admin/plugins/install', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': (document.querySelector('meta[name="_token"]') as any)?.content || ''
                },
                body: JSON.stringify(config),
            });

            if (response.ok) {
                (window as any).swal({
                    title: t('plugins.install_success'),
                    text: t('plugins.install_success_text'),
                    type: 'success',
                    timer: 2000
                });
                setJsonInput('');
                refreshPlugins();
            } else {
                const data = await response.json();
                throw new Error(data.error || t('plugins.install_failed'));
            }
        } catch (err: any) {
            (window as any).swal({ title: t('plugins.install_failed'), text: err.message, type: 'error' });
        } finally {
            setInstalling(false);
        }
    };

    const handleToggle = async (plugin: Plugin) => {
        try {
            const response = await fetch('/admin/plugins/toggle', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': (document.querySelector('meta[name="_token"]') as any)?.content || ''
                },
                body: JSON.stringify({ id: plugin.id, enabled: !plugin.enabled }),
            });

            if (response.ok) {
                setPlugins(prev => prev.map(p => p.id === plugin.id ? { ...p, enabled: !p.enabled } : p));
            }
        } catch (err) {
            console.error(err);
        }
    };

    const handleDelete = (id: number) => {
        (window as any).swal({
            title: t('plugins.delete_title'),
            text: t('plugins.delete_text'),
            type: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#ef4444',
            confirmButtonText: t('plugins.delete_confirm'),
            cancelButtonText: t('plugins.delete_cancel')
        }, async (confirmed: boolean) => {
            if (!confirmed) return;
            try {
                const response = await fetch('/admin/plugins/delete', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'X-CSRF-TOKEN': (document.querySelector('meta[name="_token"]') as any)?.content || ''
                    },
                    body: JSON.stringify({ id }),
                });

                if (response.ok) {
                    setPlugins(prev => prev.filter(p => p.id !== id));
                }
            } catch (err) {
                console.error(err);
            }
        });
    };

    const handleDrag = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (e.type === "dragenter" || e.type === "dragover") {
            setDragActive(true);
        } else if (e.type === "dragleave") {
            setDragActive(false);
        }
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setDragActive(false);
        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            const file = e.dataTransfer.files[0];
            const reader = new FileReader();
            reader.onload = (event) => {
                setJsonInput(event.target?.result as string);
            };
            reader.readAsText(file);
        }
    };

    return (
        <Container>
            <Header>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
                    <div style={{
                        width: '4rem', height: '4rem',
                        background: 'linear-gradient(135deg, #8b5cf6 0%, #6366f1 100%)',
                        borderRadius: '1.25rem', display: 'flex', alignItems: 'center',
                        justifyContent: 'center', color: 'white',
                        boxShadow: '0 10px 20px rgba(139, 92, 246, 0.4)'
                    }}>
                        <FontAwesomeIcon icon={faPuzzlePiece} size="xl" />
                    </div>
                    <div>
                        <TitleGradient>{t('plugins.title')}</TitleGradient>
                        <p style={{ color: '#9ca3af', fontSize: '1rem', fontWeight: 500 }}>
                            {t('plugins.subtitle')}
                        </p>
                    </div>
                </div>
                <PremiumButton onClick={refreshPlugins} disabled={loading} style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}>
                    <FontAwesomeIcon icon={faMagic} spin={loading} />
                    {t('plugins.refresh')}
                </PremiumButton>
            </Header>

            <GlassCard
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
                style={{
                    borderColor: dragActive ? '#8b5cf6' : 'rgba(255,255,255,0.1)',
                    background: dragActive ? 'rgba(139, 92, 246, 0.05)' : 'rgba(17, 24, 39, 0.7)'
                }}
            >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '2rem' }}>
                    <div>
                        <h3 style={{ color: 'white', fontSize: '1.5rem', fontWeight: 700, marginBottom: '0.5rem' }}>{t('plugins.install_title')}</h3>
                        <p style={{ color: '#9ca3af', fontSize: '0.875rem' }}>{t('plugins.install_desc')}</p>
                    </div>
                    <FontAwesomeIcon icon={faCloudUploadAlt} size="2x" style={{ color: dragActive ? '#8b5cf6' : 'rgba(255,255,255,0.1)', transition: 'color 0.3s' }} />
                </div>

                <JsonTextArea
                    value={jsonInput}
                    onChange={(e) => setJsonInput(e.target.value)}
                    placeholder={t('plugins.install_placeholder')}
                />

                <div style={{ marginTop: '1.5rem', display: 'flex', justifyContent: 'flex-end' }}>
                    <PremiumButton
                        onClick={handleInstall}
                        disabled={installing || !jsonInput.trim()}
                        style={{ width: '200px' }}
                    >
                        <FontAwesomeIcon icon={installing ? faMagic : faPlus} spin={installing} />
                        {installing ? t('plugins.injecting') : t('plugins.inject')}
                    </PremiumButton>
                </div>
            </GlassCard>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '2rem', paddingLeft: '0.5rem' }}>
                <FontAwesomeIcon icon={faCogs} style={{ color: '#8b5cf6' }} />
                <h3 style={{ color: 'white', fontSize: '1.5rem', fontWeight: 800 }}>{t('plugins.active_library')}</h3>
            </div>

            {loading ? (
                <div style={{ textAlign: 'center', padding: '5rem' }}>
                    <FontAwesomeIcon icon={faPuzzlePiece} spin size="3x" style={{ color: '#8b5cf6', opacity: 0.3 }} />
                </div>
            ) : plugins.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '5rem', border: '2px dashed rgba(255,255,255,0.05)', borderRadius: '2rem' }}>
                    <h4 style={{ color: '#4b5563', fontSize: '1.25rem' }}>{t('plugins.empty')}</h4>
                </div>
            ) : (
                <div style={{ display: 'grid', gap: '1rem' }}>
                    {plugins.map((plugin, index) => (
                        <PluginRow key={plugin.id} $enabled={plugin.enabled} style={{ animationDelay: `${index * 0.1}s` }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
                                <div style={{
                                    width: '3.5rem', height: '3.5rem',
                                    background: plugin.enabled ? 'rgba(139, 92, 246, 0.1)' : 'rgba(255,255,255,0.05)',
                                    borderRadius: '1rem', display: 'flex', alignItems: 'center',
                                    justifyContent: 'center', color: plugin.enabled ? '#8b5cf6' : '#4b5563'
                                }}>
                                    <FontAwesomeIcon icon={plugin.type === 'iframe' ? faMagic : faPuzzlePiece} size="lg" />
                                </div>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.375rem' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                        <span style={{ color: 'white', fontWeight: 700, fontSize: '1.1rem' }}>{plugin.name}</span>
                                        <Badge>{plugin.slot}</Badge>
                                        {plugin.enabled && <FontAwesomeIcon icon={faCheckCircle} style={{ color: '#10b981', fontSize: '0.8rem' }} />}
                                    </div>
                                    <span style={{ color: '#6b7280', fontSize: '0.875rem' }}>
                                        {plugin.description || t('plugins.no_description')}
                                    </span>
                                </div>
                            </div>

                            <div style={{ display: 'flex', alignItems: 'center', gap: '2rem' }}>
                                <div style={{ textAlign: 'right', display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                                    <span style={{ color: plugin.enabled ? '#10b981' : '#ef4444', fontSize: '0.7rem', fontWeight: 800, textTransform: 'uppercase' }}>
                                        {plugin.enabled ? t('plugins.status_active') : t('plugins.status_disabled')}
                                    </span>
                                    <Switch
                                        name={`plugin-${plugin.id}`}
                                        checked={plugin.enabled}
                                        onChange={() => handleToggle(plugin)}
                                    />
                                </div>
                                <PremiumButton $variant="danger" onClick={() => handleDelete(plugin.id)} style={{ padding: '0.6rem' }}>
                                    <FontAwesomeIcon icon={faTrash} />
                                </PremiumButton>
                            </div>
                        </PluginRow>
                    ))}
                </div>
            )}
        </Container>
    );
};

export default PluginManager;
