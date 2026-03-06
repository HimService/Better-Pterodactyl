import React from 'react';
import { NavLink, Route, Switch } from 'react-router-dom';
import NavigationBar from '@/components/NavigationBar';
import AnnouncementBanner from '@/components/elements/AnnouncementBanner';
import Sidebar from '@/components/Sidebar';
import DashboardContainer from '@/components/dashboard/DashboardContainer';
import EconomyStoreContainer from '@/components/dashboard/EconomyStoreContainer';
import CreateServerContainer from '@/components/dashboard/CreateServerContainer';
import { NotFound } from '@/components/elements/ScreenBlock';
import TransitionRouter from '@/TransitionRouter';
import SubNavigation from '@/components/elements/SubNavigation';
import { useLocation } from 'react-router';
import Spinner from '@/components/elements/Spinner';
import routes from '@/routers/routes';
import { useTranslation } from 'react-i18next';
import { useStoreState } from 'easy-peasy';
import { ApplicationStore } from '@/state';
import PluginSlot from '@/components/elements/plugins/PluginSlot';

export default function DashboardRouter() {
    const { t } = useTranslation();
    const location = useLocation();

    const economyEnabled = useStoreState((state: ApplicationStore) => state.user.data?.economyEnabled || false);

    return (
        <div className="flex w-full min-h-screen transition-colors duration-300">
            <Sidebar />
            <div className="flex flex-col flex-1 w-full overflow-hidden">
                <NavigationBar />
                <AnnouncementBanner />
                <div className="px-4 md:px-10 mt-4">
                    <PluginSlot id="dashboard_header" />
                </div>
                {location.pathname.startsWith('/account') && (
                    <SubNavigation>
                        <div>
                            {routes.account
                                .filter((route) => !!route.name)
                                .map(({ path, name, exact = false }) => (
                                    <NavLink key={path} to={`/account/${path}`.replace('//', '/')} exact={exact}>
                                        {t(`navigation.${name!.toLowerCase().replace(/\s/g, '_')}`)}
                                    </NavLink>
                                ))}
                        </div>
                    </SubNavigation>
                )}
                <TransitionRouter>
                    <React.Suspense fallback={<Spinner centered />}>
                        <Switch location={location}>
                            <Route path={'/'} exact>
                                <DashboardContainer />
                            </Route>
                            {economyEnabled && (
                                <>
                                    <Route path={'/economy'} exact>
                                        <EconomyStoreContainer />
                                    </Route>
                                    <Route path={'/economy/create'} exact>
                                        <CreateServerContainer />
                                    </Route>
                                </>
                            )}
                            {routes.account.map(({ path, component: Component }) => (
                                <Route key={path} path={`/account/${path}`.replace('//', '/')} exact>
                                    <Component />
                                </Route>
                            ))}
                            <Route path={'*'}>
                                <NotFound />
                            </Route>
                        </Switch>
                    </React.Suspense>
                </TransitionRouter>
            </div>
        </div>
    );
};
