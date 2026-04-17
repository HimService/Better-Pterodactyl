import TransferListener from '@/components/server/TransferListener';
import React, { useEffect, useState } from 'react';
import { NavLink, Route, Switch, useRouteMatch } from 'react-router-dom';
import NavigationBar from '@/components/NavigationBar';
import AnnouncementBanner from '@/components/elements/AnnouncementBanner';
import Sidebar from '@/components/Sidebar';
import TransitionRouter from '@/TransitionRouter';
import WebsocketHandler from '@/components/server/WebsocketHandler';
import { ServerContext } from '@/state/server';
import { CSSTransition } from 'react-transition-group';
import Can from '@/components/elements/Can';
import Spinner from '@/components/elements/Spinner';
import { NotFound, ServerError } from '@/components/elements/ScreenBlock';
import { httpErrorToHuman } from '@/api/http';
import { useStoreState } from 'easy-peasy';
import SubNavigation from '@/components/elements/SubNavigation';
import InstallListener from '@/components/server/InstallListener';
import ErrorBoundary from '@/components/elements/ErrorBoundary';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faExternalLinkAlt } from '@fortawesome/free-solid-svg-icons';
import { useLocation } from 'react-router';
import ConflictStateRenderer from '@/components/server/ConflictStateRenderer';
import PermissionRoute from '@/components/elements/PermissionRoute';
import routes from '@/routers/routes';
import { useTranslation } from 'react-i18next';
import styled from 'styled-components/macro';
import PluginSlot from '@/components/elements/plugins/PluginSlot';

const BrandingContainer = styled.div<{ $color?: string }>`
    --brand-main: ${props => props.$color || 'var(--color-brand-500)'};
    --brand-glow: ${props => props.$color ? `${props.$color}33` : 'rgba(var(--color-brand-500), 0.2)'};
`;

export default () => {
    const { t } = useTranslation();
    const match = useRouteMatch<{ id: string }>();
    const location = useLocation();

    const rootAdmin = useStoreState((state) => state.user.data?.rootAdmin || false);
    const [error, setError] = useState('');

    const id = ServerContext.useStoreState((state) => state.server.data?.id);
    const uuid = ServerContext.useStoreState((state) => state.server.data?.uuid);
    const inConflictState = ServerContext.useStoreState((state) => state.server.inConflictState);
    const serverId = ServerContext.useStoreState((state) => state.server.data?.internalId);
    const getServer = ServerContext.useStoreActions((actions) => actions.server.getServer);
    const clearServerState = ServerContext.useStoreActions((actions) => actions.clearServerState);

    const to = (value: string, url = false) => {
        if (value === '/') {
            return url ? match.url : match.path;
        }
        return `${(url ? match.url : match.path).replace(/\/*$/, '')}/${value.replace(/^\/+/, '')}`;
    };

    useEffect(
        () => () => {
            clearServerState();
        },
        []
    );

    useEffect(() => {
        setError('');

        getServer(match.params.id).catch((error) => {
            console.error(error);
            setError(httpErrorToHuman(error));
        });

        return () => {
            clearServerState();
        };
    }, [match.params.id]);

    const description = ServerContext.useStoreState((state) => state.server.data?.description);

    const branding = React.useMemo(() => {
        if (!description) return { color: undefined, tag: undefined };

        const tags: Record<string, string> = {
            'survival': '#10b981', // Emerald
            'combat': '#ef4444',   // Red
            'creative': '#3b82f6', // Blue
            'horror': '#7c3aed',   // Violet
            'vanilla': '#f59e0b',  // Amber
        };

        const foundTag = Object.keys(tags).find(t => description.toLowerCase().includes(`[${t}]`));
        return {
            tag: foundTag,
            color: foundTag ? tags[foundTag] : undefined
        };
    }, [description]);

    const isPopout = location.pathname.endsWith('/console-popout');

    return (
        <BrandingContainer $color={branding.color} key={'server-router'} className="flex w-full min-h-screen transition-colors duration-300 relative">
            {/* Atmospheric Background Layer */}
            {branding.color && (
                <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden opacity-30">
                    <div
                        className="absolute -top-[10%] -left-[10%] w-[50rem] h-[50rem] rounded-full filter blur-[120px] animate-pulse"
                        style={{ backgroundColor: `${branding.color}33` }}
                    />
                    <div
                        className="absolute -bottom-[10%] -right-[10%] w-[40rem] h-[40rem] rounded-full filter blur-[150px] animate-pulse"
                        style={{ backgroundColor: `${branding.color}22` }}
                    />
                </div>
            )}

            {!isPopout && <Sidebar />}
            <div className="flex flex-col flex-1 w-full overflow-hidden relative z-10">
                {!isPopout && <NavigationBar />}
                {!isPopout && <AnnouncementBanner />}
                {!uuid || !id ? (
                    error ? (
                        <ServerError message={error} />
                    ) : (
                        <Spinner size={'large'} centered />
                    )
                ) : (
                    <>
                        <InstallListener />
                        <TransferListener />
                        <WebsocketHandler />
                        {!isPopout ? (
                            <>
                                <div className="px-4 md:px-10 mt-4">
                                    <PluginSlot id="server_header" />
                                </div>
                                <CSSTransition timeout={150} classNames={'fade'} appear in>
                                    <SubNavigation>
                                        <div>
                                            {routes.server
                                                .filter((route) => !!route.name)
                                                .map((route) =>
                                                    route.permission ? (
                                                        <Can key={route.path} action={route.permission} matchAny primary>
                                                            <NavLink to={to(route.path, true)} exact={route.exact} activeStyle={{ color: branding.color }}>
                                                                {t(`navigation.${route.name!.toLowerCase().replace(/\s/g, '_')}`)}
                                                            </NavLink>
                                                        </Can>
                                                    ) : (
                                                        <NavLink key={route.path} to={to(route.path, true)} exact={route.exact} activeStyle={{ color: branding.color }}>
                                                            {t(`navigation.${route.name!.toLowerCase().replace(/\s/g, '_')}`)}
                                                        </NavLink>
                                                    )
                                                )}
                                            {rootAdmin && (
                                                // eslint-disable-next-line react/jsx-no-target-blank
                                                <a href={`/admin/servers/view/${serverId}`} target={'_blank'}>
                                                    <FontAwesomeIcon icon={faExternalLinkAlt} />
                                                </a>
                                            )}
                                        </div>
                                    </SubNavigation>
                                </CSSTransition>
                                {inConflictState && (!rootAdmin || (rootAdmin && !location.pathname.endsWith(`/server/${id}`))) && ServerContext.useStoreState(state => state.server.data?.status) !== 'installing' ? (
                                    <ConflictStateRenderer />
                                ) : (
                                    <ErrorBoundary>
                                        <TransitionRouter>
                                            <Switch location={location}>
                                                {routes.server.map(({ path, permission, component: Component }: any) => (
                                                    <PermissionRoute key={path} permission={permission} path={to(path)} exact>
                                                        <Spinner.Suspense>
                                                            <Component />
                                                        </Spinner.Suspense>
                                                    </PermissionRoute>
                                                ))}
                                                <Route path={'*'} component={NotFound} />
                                            </Switch>
                                        </TransitionRouter>
                                    </ErrorBoundary>
                                )}
                                <div className="px-4 md:px-10 mt-4">
                                    <PluginSlot id="server_footer" />
                                </div>
                            </>
                        ) : (
                            <ErrorBoundary>
                                <Switch location={location}>
                                    {routes.server.filter((r: any) => r.path === '/console-popout').map(({ path, permission, component: Component }: any) => (
                                        <PermissionRoute key={path} permission={permission} path={to(path)} exact>
                                            <Spinner.Suspense>
                                                <Component />
                                            </Spinner.Suspense>
                                        </PermissionRoute>
                                    ))}
                                    <Route path={'*'} component={NotFound} />
                                </Switch>
                            </ErrorBoundary>
                        )}
                    </>
                )}
            </div>
        </BrandingContainer>
    );
};
