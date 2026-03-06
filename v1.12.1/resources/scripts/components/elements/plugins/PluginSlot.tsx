import React, { useEffect, useRef } from 'react';
import useSWR from 'swr';
import http from '@/api/http';
import styled, { keyframes } from 'styled-components';

const slideIn = keyframes`
    from { opacity: 0; transform: translateX(-20px); }
    to { opacity: 1; transform: translateX(0); }
`;

const PluginContainer = styled.div`
    display: flex;
    flex-direction: column;
    align-items: center;
    width: 100%;
    padding: 0.5rem;
    gap: 1rem;
`;

const PluginItem = styled.div<{ $slotId: string }>`
    width: ${props => props.$slotId === 'sidebar' ? '48px' : '100%'};
    animation: ${slideIn} 0.5s ease-out backwards;
    transition: transform 0.2s ease;

    &:hover {
        transform: ${props => props.$slotId === 'sidebar' ? 'scale(1.1)' : 'none'};
    }
`;

/**
 * A helper component that renders HTML and executes any <script> tags within it.
 */
const PluginHTML = ({ html }: { html: string }) => {
    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!containerRef.current) return;

        /**
         * Ensures that Swal/swal is available for plugins.
         * If missing, it injects SweetAlert2 from CDN.
         */
        const ensureSwal = () => {
            return new Promise<void>((resolve) => {
                if ((window as any).Swal || (window as any).swal) {
                    if (!(window as any).Swal) (window as any).Swal = (window as any).swal;
                    if (!(window as any).swal) (window as any).swal = (window as any).Swal;
                    resolve();
                    return;
                }

                console.log('[Plugin System] SweetAlert2 missing, injecting via CDN...');
                const script = document.createElement('script');
                script.src = 'https://cdn.jsdelivr.net/npm/sweetalert2@11';
                script.onload = () => {
                    (window as any).swal = (window as any).Swal;
                    resolve();
                };
                document.head.appendChild(script);
            });
        };

        const executeScripts = async () => {
            if (!containerRef.current) return;

            // Wait for dependencies
            await ensureSwal();

            const scripts = Array.from(containerRef.current.querySelectorAll('script'));

            scripts.forEach((oldScript) => {
                const scriptText = oldScript.textContent || oldScript.innerHTML || '';

                if (scriptText) {
                    try {
                        (window as any).eval(scriptText);
                    } catch (e) {
                        console.error('[Plugin Error] Script execution failed:', e);
                    }
                }

                if (oldScript.src) {
                    const newScript = document.createElement('script');
                    Array.from(oldScript.attributes).forEach(attr => newScript.setAttribute(attr.name, attr.value));
                    document.head.appendChild(newScript);
                }

                oldScript.parentNode?.removeChild(oldScript);
            });
        };

        const handle = requestAnimationFrame(() => executeScripts());
        return () => cancelAnimationFrame(handle);
    }, [html]);

    return <div ref={containerRef} dangerouslySetInnerHTML={{ __html: html }} />;
};

interface Plugin {
    id: number;
    name: string;
    type: string;
    config: any;
}

interface Props {
    id: string;
}

const PluginSlot = ({ id }: Props) => {
    const { data, error } = useSWR<Record<string, Plugin[]>>('/api/client/plugins', (url) =>
        http.get(url).then((res) => res.data)
    );

    if (error || !data || !data[id]) {
        return null;
    }

    return (
        <PluginContainer className="plugin-slot-container" data-slot={id}>
            {data[id].map((plugin, index) => (
                <PluginItem key={plugin.id} $slotId={id} className="plugin-item" style={{ animationDelay: `${index * 0.1}s` }}>
                    {plugin.type === 'iframe' && (
                        <div style={{
                            position: 'relative',
                            width: id === 'sidebar' ? '48px' : '100%',
                            height: id === 'sidebar' ? '48px' : (plugin.config.height || '150px'),
                            overflow: 'hidden',
                            borderRadius: '12px',
                            boxShadow: '0 4px 12px rgba(0,0,0,0.2)'
                        }}>
                            <iframe
                                src={plugin.config.url}
                                style={{
                                    width: '100%',
                                    height: '100%',
                                    border: 'none',
                                    pointerEvents: 'none',
                                }}
                                title={plugin.name}
                            />
                        </div>
                    )}
                    {plugin.type === 'custom_html' && (
                        <PluginHTML html={plugin.config.html} />
                    )}
                </PluginItem>
            ))}
        </PluginContainer>
    );
};

export default PluginSlot;
