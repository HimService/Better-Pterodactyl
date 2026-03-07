import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import useSWR from 'swr';
import http from '@/api/http';
import Spinner from '@/components/elements/Spinner';
import { PluginHTML } from '@/components/elements/plugins/PluginSlot';
import styled from 'styled-components';
import { NotFound } from '@/components/elements/ScreenBlock';

const PageContainer = styled.div`
    min-height: calc(100vh - 100px);
    display: flex;
    flex-direction: column;

    & > div {
        flex: 1;
        display: flex;
        flex-direction: column;
    }
`;

interface Plugin {
    id: number;
    name: string;
    type: string;
    config: any;
}

const PluginPageContainer = () => {
    const { slug } = useParams<{ slug: string }>();
    const { data, error } = useSWR<Record<string, Plugin[]>>('/api/client/plugins', (url) =>
        http.get(url).then((res) => res.data)
    );

    const [targetPlugin, setTargetPlugin] = useState<Plugin | null>(null);
    const [searching, setSearching] = useState(true);

    useEffect(() => {
        if (data) {
            let found = false;
            // Iterate through all slots to find a plugin with matching route config
            Object.values(data).forEach(slotPlugins => {
                slotPlugins.forEach(plugin => {
                    if (plugin.config && plugin.config.route === slug) {
                        setTargetPlugin(plugin);
                        found = true;
                    }
                });
            });
            setSearching(false);
        }
    }, [data, slug]);

    if (error) return <NotFound />;
    if (!data || searching) return <Spinner centered />;
    if (!targetPlugin) return <NotFound />;

    return (
        <PageContainer>
            <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', flex: 1 }}>
                <PluginHTML
                    html={targetPlugin.config.html}
                    variables={targetPlugin.config.variables}
                    pluginId={targetPlugin.id}
                />
            </div>
        </PageContainer>
    );
};

export default PluginPageContainer;
