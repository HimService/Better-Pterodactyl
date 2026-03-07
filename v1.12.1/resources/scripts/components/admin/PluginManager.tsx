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
    faCog,
    faSave,
} from '@fortawesome/free-solid-svg-icons';
import Switch from '@/components/elements/Switch';
import { useTranslation } from 'react-i18next';
import Modal from '@/components/elements/Modal';
import { faCloud, faChartBar, faComments, faFileCode } from '@fortawesome/free-solid-svg-icons';

const TEMPLATES = [
    {
        name: 'Weather Widget (天氣小工具)',
        description: '在儀表板頂部顯示即時天氣 (採用 iframe)',
        icon: faCloud,
        json: {
            name: '即時天氣',
            description: '顯示目前城市的即時天氣狀況',
            slot: 'dashboard_header',
            type: 'iframe',
            config: {
                url: 'https://wttr.in/?format=3',
                height: '60px'
            }
        }
    },
    {
        name: 'Status Overview (系統狀態卡)',
        description: '高質感的系統公告與狀態卡 (採用 Custom HTML)',
        icon: faChartBar,
        json: {
            name: '系統公告',
            slot: 'dashboard_header',
            type: 'custom_html',
            config: {
                html: '<div style=\"background: rgba(139, 92, 246, 0.1); border: 1px solid rgba(139, 92, 246, 0.3); padding: 20px; border-radius: 16px; backdrop-filter: blur(10px); display: flex; align-items: center; gap: 15px;\"><div style=\"font-size: 24px;\">🚀</div><div><div style=\"font-size: 14px; color: #a78bfa; font-weight: bold;\">{{tag}}</div><div style=\"font-size: 16px; color: white;\">{{message}}</div></div></div>',
                variables: {
                    tag: { value: '系統公告', label: '標籤文字' },
                    message: { value: '歡迎使用 Better Pterodactyl 面板！', label: '內容訊息' }
                }
            }
        }
    },
    {
        name: 'Discord Card (Discord 伺服器卡)',
        description: '在側邊欄最底端顯示 Discord 連結',
        icon: faComments,
        json: {
            name: 'Discord 連結',
            slot: 'sidebar_bottom',
            type: 'custom_html',
            config: {
                html: '<a href=\"{{url}}\" target=\"_blank\" style=\"cursor:pointer; width:48px; height:48px; display:flex; align-items:center; justify-content:center; background:#5865F2; border-radius:12px; color:white; transition:transform 0.2s;\"><svg width=\"24\" height=\"24\" fill=\"currentColor\" viewBox=\"0 0 24 24\"><path d=\"M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028 14.09 14.09 0 0 0 1.226-1.994.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.419-2.157 2.419zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.419-2.157 2.419z\"/></svg></a>',
                variables: {
                    url: { value: 'https://discord.gg/yourserver', label: 'Discord 邀請鏈接' }
                }
            }
        }
    }
];

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

const LogViewer = styled.div`
    background: rgba(17, 24, 39, 0.9);
    border: 1px solid rgba(255, 255, 255, 0.05);
    border-radius: 1.25rem;
    padding: 1.5rem;
    font-family: 'Fira Code', 'Courier New', monospace;
    font-size: 0.85rem;
    max-height: 400px;
    overflow-y: auto;
    display: flex;
    flex-direction: column;
    gap: 0.5rem;

    &::-webkit-scrollbar { width: 6px; }
    &::-webkit-scrollbar-thumb { background: rgba(139, 92, 246, 0.3); border-radius: 3px; }
`;

const LogEntryLine = styled.div<{ $level: string }>`
    display: flex;
    gap: 1rem;
    padding: 0.5rem;
    border-radius: 0.5rem;
    background: ${props =>
        props.$level === 'error' ? 'rgba(239, 68, 68, 0.1)' :
            props.$level === 'warn' ? 'rgba(245, 158, 11, 0.1)' : 'transparent'
    };
    color: ${props =>
        props.$level === 'error' ? '#f87171' :
            props.$level === 'warn' ? '#fbbf24' : '#9ca3af'
    };
`;

interface LogEntry {
    pluginId: string;
    timestamp: string;
    level: 'info' | 'warn' | 'error';
    message: string;
}

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
    const [selectedPlugin, setSelectedPlugin] = useState<Plugin | null>(null);
    const [configVariables, setConfigVariables] = useState<Record<string, any>>({});
    const [showGallery, setShowGallery] = useState(false);
    const [logs, setLogs] = useState<LogEntry[]>((window as any).__BP_LOGS || []);

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
        const handleLog = (e: any) => {
            setLogs(prev => [...prev, e.detail].slice(-100)); // Keep last 100
        };
        window.addEventListener('bp-log', handleLog);
        return () => window.removeEventListener('bp-log', handleLog);
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

    const handleUpdateConfig = async () => {
        if (!selectedPlugin) return;
        try {
            const response = await fetch('/admin/plugins/config', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': (document.querySelector('meta[name="_token"]') as any)?.content || ''
                },
                body: JSON.stringify({ id: selectedPlugin.id, config: { ...JSON.parse(selectedPlugin.config), variables: configVariables } }),
            });

            if (response.ok) {
                (window as any).swal({ title: t('plugins.save_success'), type: 'success', timer: 1500 });
                setSelectedPlugin(null);
                refreshPlugins();
            }
        } catch (err) {
            console.error(err);
        }
    };

    const openSettings = (plugin: Plugin) => {
        setSelectedPlugin(plugin);
        try {
            const config = JSON.parse(plugin.config);
            setConfigVariables(config.variables || {});
        } catch (e) {
            setConfigVariables({});
        }
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



            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem', paddingLeft: '0.5rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <FontAwesomeIcon icon={faMagic} style={{ color: '#8b5cf6' }} />
                    <h3 style={{ color: 'white', fontSize: '1.5rem', fontWeight: 800 }}>{t('plugins.developer_console')}</h3>
                </div>
                <PremiumButton
                    onClick={() => { setLogs([]); (window as any).__BP_LOGS = []; }}
                    style={{ padding: '0.5rem 1rem', fontSize: '0.75rem', background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.2)', color: '#ef4444' }}
                >
                    <FontAwesomeIcon icon={faTrash} />
                    {t('plugins.clear_logs')}
                </PremiumButton>
            </div>

            <LogViewer style={{ marginBottom: '3rem' }}>
                {logs.length === 0 ? (
                    <div style={{ color: '#4b5563', textAlign: 'center', padding: '2rem' }}>{t('plugins.no_logs')}</div>
                ) : (
                    logs.map((log, i) => (
                        <LogEntryLine key={i} $level={log.level}>
                            <span style={{ color: '#6366f1', minWidth: '150px' }}>[{new Date(log.timestamp).toLocaleTimeString()}]</span>
                            <Badge style={{ minWidth: '80px', textAlign: 'center' }}>ID: {log.pluginId}</Badge>
                            <span style={{ fontWeight: 700, minWidth: '50px', textTransform: 'uppercase' }}>{log.level}:</span>
                            <span style={{ flex: 1 }}>{log.message}</span>
                        </LogEntryLine>
                    ))
                )}
            </LogViewer>

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
                                <div style={{ display: 'flex', gap: '0.5rem' }}>
                                    <PremiumButton
                                        onClick={() => {
                                            const blob = new Blob([plugin.config], { type: 'application/json' });
                                            const url = URL.createObjectURL(blob);
                                            const a = document.createElement('a');
                                            a.href = url;
                                            a.download = `${plugin.name.replace(/\s+/g, '_')}.json`;
                                            a.click();
                                        }}
                                        style={{ padding: '0.6rem', background: 'rgba(59, 130, 246, 0.1)', border: '1px solid rgba(59, 130, 246, 0.2)', color: '#3b82f6' }}
                                        title={t('plugins.export')}
                                    >
                                        <FontAwesomeIcon icon={faCloudUploadAlt} />
                                    </PremiumButton>
                                    <PremiumButton onClick={() => openSettings(plugin)} style={{ padding: '0.6rem', background: 'rgba(139, 92, 246, 0.1)', border: '1px solid rgba(139, 92, 246, 0.2)', color: '#8b5cf6' }}>
                                        <FontAwesomeIcon icon={faCog} />
                                    </PremiumButton>
                                    <PremiumButton $variant="danger" onClick={() => handleDelete(plugin.id)} style={{ padding: '0.6rem' }}>
                                        <FontAwesomeIcon icon={faTrash} />
                                    </PremiumButton>
                                </div>
                            </div>
                        </PluginRow>
                    ))}
                </div>
            )}

            <Modal
                visible={!!selectedPlugin}
                onDismissed={() => setSelectedPlugin(null)}
                closeOnBackground={true}
            >
                <div style={{ padding: '1rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '2rem' }}>
                        <FontAwesomeIcon icon={faCog} style={{ color: '#8b5cf6' }} size="lg" />
                        <h2 style={{ color: 'white', fontSize: '1.5rem', fontWeight: 700 }}>
                            {selectedPlugin?.name} {t('plugins.settings')}
                        </h2>
                    </div>

                    <div style={{ display: 'grid', gap: '1.5rem', marginBottom: '2rem' }}>
                        {Object.entries(configVariables).length === 0 ? (
                            <p style={{ color: '#6b7280', textAlign: 'center' }}>{t('plugins.no_variables')}</p>
                        ) : (
                            Object.entries(configVariables).map(([key, data]: [string, any]) => (
                                <div key={key}>
                                    <label style={{ display: 'block', color: '#9ca3af', fontSize: '0.875rem', fontWeight: 600, marginBottom: '0.5rem' }}>
                                        {data.label || key}
                                    </label>
                                    <input
                                        type="text"
                                        value={data.value}
                                        onChange={(e) => setConfigVariables({
                                            ...configVariables,
                                            [key]: { ...data, value: e.target.value }
                                        })}
                                        style={{
                                            width: '100%',
                                            background: 'rgba(31, 41, 55, 0.5)',
                                            border: '1px solid rgba(255, 255, 255, 0.1)',
                                            borderRadius: '0.75rem',
                                            padding: '0.75rem 1rem',
                                            color: 'white',
                                            outline: 'none',
                                            transition: 'border-color 0.2s'
                                        }}
                                    />
                                </div>
                            ))
                        )}
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem' }}>
                        <PremiumButton
                            onClick={() => setSelectedPlugin(null)}
                            style={{ background: 'transparent', border: '1px solid rgba(255,255,255,0.1)', color: '#9ca3af' }}
                        >
                            {t('plugins.cancel')}
                        </PremiumButton>
                        <PremiumButton onClick={handleUpdateConfig}>
                            <FontAwesomeIcon icon={faSave} />
                            {t('plugins.save_changes')}
                        </PremiumButton>
                    </div>
                </div>
            </Modal>

            <Modal
                visible={showGallery}
                onDismissed={() => setShowGallery(false)}
                closeOnBackground={true}
            >
                <div style={{ padding: '1rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '2rem' }}>
                        <FontAwesomeIcon icon={faMagic} style={{ color: '#8b5cf6' }} size="lg" />
                        <h2 style={{ color: 'white', fontSize: '1.5rem', fontWeight: 700 }}>
                            {t('plugins.template_gallery')}
                        </h2>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
                        {TEMPLATES.map((tpl) => (
                            <div
                                key={tpl.name}
                                onClick={() => {
                                    setJsonInput(JSON.stringify(tpl.json, null, 2));
                                    setShowGallery(false);
                                }}
                                style={{
                                    background: 'rgba(31, 41, 55, 0.5)',
                                    border: '1px solid rgba(255, 255, 255, 0.1)',
                                    borderRadius: '1rem',
                                    padding: '1.5rem',
                                    cursor: 'pointer',
                                    transition: 'all 0.2s',
                                }}
                                onMouseOver={(e) => {
                                    e.currentTarget.style.borderColor = 'rgba(139, 92, 246, 0.5)';
                                    e.currentTarget.style.background = 'rgba(31, 41, 55, 0.8)';
                                }}
                                onMouseOut={(e) => {
                                    e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.1)';
                                    e.currentTarget.style.background = 'rgba(31, 41, 55, 0.5)';
                                }}
                            >
                                <div style={{ width: '3rem', height: '3rem', background: 'rgba(139, 92, 246, 0.1)', borderRadius: '0.75rem', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1rem', color: '#8b5cf6' }}>
                                    <FontAwesomeIcon icon={tpl.icon} size="lg" />
                                </div>
                                <h4 style={{ color: 'white', fontWeight: 700, marginBottom: '0.5rem' }}>{tpl.name}</h4>
                                <p style={{ color: '#9ca3af', fontSize: '0.8rem' }}>{tpl.description}</p>
                            </div>
                        ))}
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'center' }}>
                        <PremiumButton
                            onClick={() => setShowGallery(false)}
                            style={{ background: 'transparent', border: '1px solid rgba(255,255,255,0.1)', color: '#9ca3af' }}
                        >
                            {t('plugins.close')}
                        </PremiumButton>
                    </div>
                </div>
            </Modal>
        </Container>
    );
};

export default PluginManager;
