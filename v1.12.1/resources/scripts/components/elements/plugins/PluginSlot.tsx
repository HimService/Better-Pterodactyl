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
/**
 * A helper component that renders HTML and executes any <script> tags within it.
 */
export const PluginHTML = ({ html, variables = {}, pluginId, permissions = [] }: { html: string; variables?: Record<string, any>; pluginId?: number; permissions?: string[] }) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const shadowRef = useRef<ShadowRoot | null>(null);

    /**
     * Ensures dependencies (Swal, DOMPurify) are available.
     */
    const ensureDependencies = () => {
        const loadScript = (id: string, src: string) => {
            return new Promise<void>((resolve) => {
                if ((window as any)[id] || document.getElementById(`bp-dep-${id}`)) {
                    resolve();
                    return;
                }
                const script = document.createElement('script');
                script.id = `bp-dep-${id}`;
                script.src = src;
                script.onload = () => resolve();
                document.head.appendChild(script);
            });
        };

        return Promise.all([
            loadScript('Swal', 'https://cdn.jsdelivr.net/npm/sweetalert2@11').then(() => {
                if (!(window as any).Swal) (window as any).Swal = (window as any).swal;
                if (!(window as any).swal) (window as any).swal = (window as any).Swal;
            }),
            loadScript('DOMPurify', 'https://cdn.jsdelivr.net/npm/dompurify@3/dist/purify.min.js')
        ]);
    };

    // Interpolate variables and sanitize HTML
    const interpolatedHtml = React.useMemo(() => {
        let result = html;

        // 0. Preliminary Cleaning (Handle global tags before sanitization)
        result = result.replace(/<!DOCTYPE.*?>/gi, '');
        result = result.replace(/<\/?html.*?>/gi, '');
        result = result.replace(/<\/?head.*?>/gi, '');
        result = result.replace(/<\/?body.*?>/gi, '');

        // 1. Handle simple variable replacement: {{key}}
        Object.entries(variables).forEach(([key, data]: [string, any]) => {
            const value = data.value !== undefined ? data.value : '';
            const regex = new RegExp(`{{${key}}}`, 'g');
            result = result.replace(regex, value);
        });

        // 2. Handle basic conditional logic: {{if key == "value"}} ... {{/if}}
        const ifRegex = /{{if\s+(\w+)\s*==\s*"(.*?)"}}([\s\S]*?){{\/if}}/g;
        result = result.replace(ifRegex, (match, key, expectedValue, content) => {
            const actualValue = variables[key]?.value;
            const isMatch = String(actualValue) === expectedValue;
            return isMatch ? content : '';
        });

        return result;
    }, [html, variables]);

    useEffect(() => {
        if (!containerRef.current) return;

        // Initialize Shadow DOM if not already done
        if (!shadowRef.current) {
            shadowRef.current = containerRef.current.attachShadow({ mode: 'open' });
        }

        const executeScripts = async () => {
            if (!shadowRef.current) return;

            // Wait for dependencies
            await ensureDependencies();

            // 1. Pre-process: Separate scripts and styles from the HTML to prevent DOMPurify interference
            // 1. Pre-process: Separate scripts and styles from the HTML to prevent DOMPurify interference
            const tempDiv = document.createElement('div');
            tempDiv.innerHTML = interpolatedHtml;

            // Extract Scripts
            const scriptData: { text: string; src: string | null; attrs: { name: string; value: string }[] }[] = [];
            const scriptTags = Array.from(tempDiv.querySelectorAll('script'));
            scriptTags.forEach(s => {
                scriptData.push({
                    text: s.textContent || s.innerHTML || '',
                    src: s.getAttribute('src'),
                    attrs: Array.from(s.attributes).map(a => ({ name: a.name, value: a.value }))
                });
                s.parentNode?.removeChild(s);
            });

            // Extract Styles (to prevent DOMPurify from stripping CSS rules)
            const styles: string[] = [];
            const styleTags = Array.from(tempDiv.querySelectorAll('style'));
            styleTags.forEach(s => {
                styles.push(s.textContent || s.innerHTML || '');
                s.parentNode?.removeChild(s);
            });

            // 2. Sanitize the remaining HTML content
            const remainingHtml = tempDiv.innerHTML;
            const cleanHtml = (window as any).DOMPurify
                ? (window as any).DOMPurify.sanitize(remainingHtml, {
                    ADD_TAGS: ['style'], // Keep tags but content is already extracted
                    ADD_ATTR: ['onclick', 'onmouseover', 'onmouseout', 'data-*'],
                    FORBID_TAGS: ['html', 'head', 'body', 'iframe'],
                    SANITIZE_DOM: false
                })
                : remainingHtml;

            // 3. Set content in Shadow DOM with robust reset
            shadowRef.current.innerHTML = `
                <style>
                    :host { 
                        all: initial; 
                        display: flex;
                        flex-direction: column;
                        width: 100%; 
                        height: 100%; 
                        min-height: 0;
                        position: relative;
                        /* Baseline environment */
                        color: #f8fafc;
                        font-family: 'Inter', system-ui, sans-serif;
                        font-size: 16px;
                        line-height: 1.5;
                        -webkit-font-smoothing: antialiased;
                    }
                    .bp-plugin-inner { 
                        display: flex;
                        flex-direction: column;
                        flex: 1;
                        width: 100%; 
                        height: 100%; 
                        min-height: 0;
                        overflow: auto;
                    }
                    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
                    /* Injected Plugin Styles */
                    ${styles.join('\n')}
                </style>
                <div class="bp-plugin-inner">${cleanHtml}</div>
            `;

            // 4. Create SDK (Scoped per plugin instance)
            const hasPermission = (perm: string) => permissions.includes(perm) || permissions.includes('*');

            const getCsrfToken = () => {
                const meta = document.querySelector('meta[name="_token"]') || document.querySelector('meta[name="csrf-token"]');
                return meta ? meta.getAttribute('content') : '';
            };

            const getHeaders = () => ({
                'Content-Type': 'application/json',
                'Accept': 'application/json',
                'X-CSRF-TOKEN': getCsrfToken() || '',
            });

            const fetchWithJSON = (url: string, options: any = {}) => {
                return fetch(url, { ...options, headers: getHeaders(), credentials: 'same-origin' })
                    .then(r => {
                        if (!r.ok) return r.json().then(err => Promise.reject(err)).catch(() => Promise.reject(r.statusText));
                        if (r.status === 204) return {};
                        return r.text().then(text => text ? JSON.parse(text) : {});
                    });
            };

            const bp = {
                notify: (type: 'success' | 'error' | 'warning' | 'info', message: string) => {
                    (window as any).Swal.fire({
                        icon: type,
                        title: message,
                        toast: true,
                        position: 'top-end',
                        showConfirmButton: false,
                        timer: 3000,
                        timerProgressBar: true,
                    });
                },
                api: {
                    get: (url: string) => {
                        if (!hasPermission('api:get')) {
                            console.warn(`[Plugin ${pluginId}] Permission denied: api:get`);
                            return Promise.reject('Permission denied');
                        }
                        return fetchWithJSON(url);
                    },
                    post: (url: string, data: any) => {
                        if (!hasPermission('api:post')) {
                            console.warn(`[Plugin ${pluginId}] Permission denied: api:post`);
                            return Promise.reject('Permission denied');
                        }
                        return fetchWithJSON(url, { method: 'POST', body: JSON.stringify(data) });
                    },
                },
                storage: {
                    get: (key: string) => {
                        if (!hasPermission('storage')) return Promise.reject('Permission denied');
                        return fetchWithJSON(`/admin/plugins/storage?id=${pluginId}`).then(data => {
                            const item = Array.isArray(data) ? data.find((i: any) => i.key === key) : null;
                            return item ? item.value : null;
                        });
                    },
                    set: (key: string, value: string) => {
                        if (!hasPermission('storage')) return Promise.reject('Permission denied');
                        return fetchWithJSON('/admin/plugins/storage', {
                            method: 'POST',
                            body: JSON.stringify({ id: pluginId, key, value })
                        });
                    },
                    delete: (key: string) => {
                        if (!hasPermission('storage')) return Promise.reject('Permission denied');
                        return fetchWithJSON('/admin/plugins/storage/delete', {
                            method: 'POST',
                            body: JSON.stringify({ id: pluginId, key })
                        });
                    },
                }
            };

            // 5. Inject variables
            const bpVariables: Record<string, any> = {};
            Object.entries(variables).forEach(([key, data]: [string, any]) => {
                bpVariables[key] = data.value;
            });

            // 6. Execute extracted scripts
            scriptData.forEach((s) => {
                if (s.text) {
                    try {
                        const scriptWrapper = new Function('BP', 'BP_VARIABLES', 'root', s.text);
                        scriptWrapper(bp, bpVariables, shadowRef.current);
                    } catch (e) {
                        console.error(`[Plugin ${pluginId} Error] Script execution failed:`, e);
                        console.log(`[Plugin ${pluginId} Debug] ShadowRoot HTML:`, shadowRef.current?.innerHTML);
                    }
                }

                if (s.src) {
                    const newScript = document.createElement('script');
                    s.attrs.forEach(attr => newScript.setAttribute(attr.name, attr.value));
                    document.head.appendChild(newScript);
                }
            });

            // Legacy support
            (window as any).BP = bp;
            (window as any).BP_VARIABLES = bpVariables;

            const handle = requestAnimationFrame(() => {
                if (typeof (window as any).onPluginLoaded === 'function') {
                    (window as any).onPluginLoaded(bpVariables);
                }
            });
            return () => cancelAnimationFrame(handle);
        };

        const handle = requestAnimationFrame(() => executeScripts());
        return () => cancelAnimationFrame(handle);
    }, [interpolatedHtml, variables, pluginId, permissions]);

    return (
        <div
            ref={containerRef}
            className={`bp-plugin-scope bp-plugin-${pluginId}`}
            style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', flex: 1 }}
        />
    );
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
                        /* Existing iframe code */
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
                                style={{ width: '100%', height: '100%', border: 'none', pointerEvents: 'none' }}
                                title={plugin.name}
                            />
                        </div>
                    )}
                    {plugin.type === 'custom_html' && (
                        <>
                            {plugin.config.route ? (
                                // Render a Launcher if it has a route
                                <div
                                    dangerouslySetInnerHTML={{
                                        __html: (plugin.config.launcher_html || `<a href="/plugins/${plugin.config.route}" style="text-decoration:none; color:inherit; display:flex; flex-direction:column; align-items:center;"><div style="width:48px;height:48px;background:rgba(255,255,255,0.1);border-radius:12px;display:flex;align-items:center;justify-content:center;font-size:24px;">🧩</div><span style="font-size:10px;margin-top:4px;text-align:center;">${plugin.name}</span></a>`)
                                            .replace(/{{route}}/g, plugin.config.route)
                                    }}
                                />
                            ) : (
                                // Regular custom HTML
                                <PluginHTML
                                    html={plugin.config.html}
                                    variables={plugin.config.variables}
                                    pluginId={plugin.id}
                                    permissions={plugin.config.permissions || []}
                                />
                            )}
                        </>
                    )}
                </PluginItem>
            ))}
        </PluginContainer>
    );
};

export default PluginSlot;
