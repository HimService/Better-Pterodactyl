import React from 'react';
import { NavLink, Route, Switch } from 'react-router-dom';
import NavigationBar from '@/components/NavigationBar';
import Sidebar from '@/components/Sidebar';
import DashboardContainer from '@/components/dashboard/DashboardContainer';
import { NotFound } from '@/components/elements/ScreenBlock';
import TransitionRouter from '@/TransitionRouter';
import SubNavigation from '@/components/elements/SubNavigation';
import { useLocation } from 'react-router';
import Spinner from '@/components/elements/Spinner';
import routes from '@/routers/routes';
import { useTranslation } from 'react-i18next';

export default function DashboardRouter() {
    const { t } = useTranslation();
    const location = useLocation();

    return (
        <div className="flex w-full min-h-screen transition-colors duration-300">
            <Sidebar />
            <div className="flex flex-col flex-1 w-full overflow-hidden">
                <NavigationBar />
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
