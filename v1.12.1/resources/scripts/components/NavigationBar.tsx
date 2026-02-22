import * as React from 'react';
import { useState } from 'react';
import { Link, NavLink } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCogs, faLayerGroup, faSignOutAlt, faMoon, faSun, faDesktop } from '@fortawesome/free-solid-svg-icons';
import { useStoreState } from 'easy-peasy';
import { useTheme } from '@/context/ThemeContext';
import { ApplicationStore } from '@/state';
import SearchContainer from '@/components/dashboard/search/SearchContainer';
import tw, { theme } from 'twin.macro';
import styled from 'styled-components/macro';
import http from '@/api/http';
import SpinnerOverlay from '@/components/elements/SpinnerOverlay';
import Tooltip from '@/components/elements/tooltip/Tooltip';
import Avatar from '@/components/Avatar';
import { useTranslation } from 'react-i18next';

const NavigationContainer = styled.div`
    ${tw`w-full overflow-x-auto sticky top-0 z-50 transition-colors duration-300 backdrop-blur-md`};
    background-color: rgba(var(--bg-app), 0.85); /* Matches body background with some transparency */
    border-bottom: 1px solid rgb(var(--border-color, 230 230 230));
    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.03); /* Subtle drop shadow for depth */
`;

const RightNavigation = styled.div`
    & > a,
    & > button,
    & > .navigation-link {
        ${tw`flex items-center h-full no-underline px-6 cursor-pointer transition-all duration-150`};
        color: rgb(var(--text-secondary));

        &:active,
        &:hover {
            color: rgb(var(--text-primary));
            background-color: rgb(var(--bg-card-hover));
        }

        &:active,
        &:hover,
        &.active {
            box-shadow: inset 0 -2px rgb(var(--color-brand-600));
        }
    }
`;

export default () => {
    const { t } = useTranslation('frontend');
    const name = useStoreState((state: ApplicationStore) => state.settings.data!.name);
    const rootAdmin = useStoreState((state: ApplicationStore) => state.user.data!.rootAdmin);
    const [isLoggingOut, setIsLoggingOut] = useState(false);
    const { theme, setTheme } = useTheme();

    const onTriggerLogout = () => {
        setIsLoggingOut(true);
        http.post('/auth/logout').finally(() => {
            // @ts-expect-error this is valid
            window.location = '/';
        });
    };

    const toggleTheme = () => {
        if (theme === 'light') setTheme('dark');
        else if (theme === 'dark') setTheme('system');
        else setTheme('light');
    };

    const getThemeIcon = () => {
        if (theme === 'light') return faSun;
        if (theme === 'dark') return faMoon;
        return faDesktop;
    };

    const getThemeTooltip = () => {
        if (theme === 'light') return t('navigation.light_mode', 'Light Mode');
        if (theme === 'dark') return t('navigation.dark_mode', 'Dark Mode');
        return t('navigation.system_theme', 'System Theme');
    };

    return (
        <NavigationContainer>
            <SpinnerOverlay visible={isLoggingOut} />
            <div className={'mx-auto w-full flex items-center h-[3.5rem] max-w-[1200px]'}>
                <div id={'logo'} className={'flex-1'}>
                    <Link
                        to={'/'}
                        className={'text-2xl font-header font-bold tracking-tight px-4 no-underline transition-colors duration-150 text-neutral-900 dark:text-neutral-50'}
                    >
                        {name}
                    </Link>
                </div>
                <RightNavigation className={'flex h-full items-center justify-center'}>
                    <SearchContainer />
                    <Tooltip placement={'bottom'} content={t('navigation.dashboard', 'Dashboard')}>
                        <NavLink to={'/'} exact>
                            <FontAwesomeIcon icon={faLayerGroup} />
                        </NavLink>
                    </Tooltip>
                    {rootAdmin && (
                        <Tooltip placement={'bottom'} content={t('navigation.admin', 'Admin')}>
                            <a href={'/admin'} rel={'noreferrer'}>
                                <FontAwesomeIcon icon={faCogs} />
                            </a>
                        </Tooltip>
                    )}
                    <Tooltip placement={'bottom'} content={getThemeTooltip()}>
                        <button onClick={toggleTheme} className="hover:text-brand-500 transition-colors">
                            <FontAwesomeIcon icon={getThemeIcon()} />
                        </button>
                    </Tooltip>
                    <Tooltip placement={'bottom'} content={t('navigation.account_settings', 'Account Settings')}>
                        <NavLink to={'/account'}>
                            <span className={'flex items-center w-5 h-5'}>
                                <Avatar.User />
                            </span>
                        </NavLink>
                    </Tooltip>
                    <Tooltip placement={'bottom'} content={t('navigation.sign_out', 'Sign Out')}>
                        <button onClick={onTriggerLogout} className="hover:text-red-500 transition-colors">
                            <FontAwesomeIcon icon={faSignOutAlt} />
                        </button>
                    </Tooltip>
                </RightNavigation>
            </div>
        </NavigationContainer>
    );
};
