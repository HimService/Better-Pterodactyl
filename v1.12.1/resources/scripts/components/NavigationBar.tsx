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
import { Dialog } from '@/components/elements/dialog';
import { Button } from '@/components/elements/button';

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

const UserCard = styled.div`
    ${tw`relative flex flex-col items-center text-center p-8 rounded-3xl overflow-hidden shadow-2xl transition-all duration-300`};
    background: linear-gradient(135deg, rgba(23, 23, 23, 0.4) 0%, rgba(10, 10, 10, 0.6) 100%);
    backdrop-filter: blur(24px) saturate(180%);
    border: 1px solid rgba(255, 255, 255, 0.08);
    box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);

    &::before {
        content: '';
        position: absolute;
        inset: 0;
        background: radial-gradient(circle at top left, rgba(var(--color-brand-500), 0.1), transparent 70%);
        pointer-events: none;
    }
`;

const EliteButton = styled(Button)`
    ${tw`relative overflow-hidden transition-all duration-300 transform active:scale-95`};
    &::after {
        content: '';
        position: absolute;
        inset: 0;
        background: linear-gradient(to right, transparent, rgba(255, 255, 255, 0.1), transparent);
        transform: translateX(-100%);
        transition: transform 0.6s ease-in-out;
    }
    &:hover::after {
        transform: translateX(100%);
    }
`;

export default () => {
    const { t } = useTranslation();
    const name = useStoreState((state: ApplicationStore) => state.settings.data?.name || 'Pterodactyl');
    const user = useStoreState((state: ApplicationStore) => state.user.data);
    const rootAdmin = useStoreState((state: ApplicationStore) => state.user.data?.rootAdmin || false);
    const [isLoggingOut, setIsLoggingOut] = useState(false);
    const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
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
                        <button onClick={() => setShowLogoutConfirm(true)} className="hover:text-red-500 transition-colors">
                            <FontAwesomeIcon icon={faSignOutAlt} />
                        </button>
                    </Tooltip>
                </RightNavigation>
            </div>
            <Dialog
                open={showLogoutConfirm}
                onClose={() => setShowLogoutConfirm(false)}
                hideCloseIcon
            >
                <div className={'py-2'}>
                    <UserCard>
                        {/* Integrated Header */}
                        <div className={'absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-transparent via-brand-500/50 to-transparent'}></div>
                        <div className={'mb-8'}>
                            <h2 className={'text-xs font-bold tracking-[0.2em] uppercase text-neutral-500 mb-1'}>
                                {t('auth.logout_title', 'Secure Session Termination')}
                            </h2>
                            <div className={'h-px w-8 bg-brand-500 mx-auto opacity-50'}></div>
                        </div>

                        {/* Avatar Section with Pulse */}
                        <div className={'relative group'}>
                            <div className={'absolute -inset-4 bg-brand-500/20 rounded-full blur-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-700'}></div>
                            <div className={'absolute -inset-1 bg-gradient-to-tr from-brand-600 to-cyan-400 rounded-full opacity-20 group-hover:opacity-40 transition-opacity animate-pulse'}></div>
                            <div className={'relative bg-neutral-950 rounded-full p-1.5 border border-white/5 shadow-inner'}>
                                <div className={'w-28 h-28 flex items-center justify-center rounded-full overflow-hidden grayscale-[20%] group-hover:grayscale-0 transition-all duration-500 shadow-2xl'}>
                                    <Avatar name={user?.uuid || 'system'} size={112} />
                                </div>
                            </div>
                        </div>

                        {/* User Info */}
                        <div className={'mt-8 space-y-1'}>
                            <h3 className={'text-3xl font-extrabold tracking-tight text-white'}>
                                {user?.username || 'User'}
                            </h3>
                            <p className={'text-sm font-medium text-neutral-500 tabular-nums tracking-wide'}>
                                {user?.email}
                            </p>
                        </div>

                        {/* Description */}
                        <div className={'mt-8 px-4'}>
                            <p className={'text-neutral-300 text-sm leading-relaxed max-w-xs font-medium'}>
                                {t('auth.logout_confirmation', 'Your session data will be securely cleared. We look forward to your return to the panel.')}
                            </p>
                        </div>

                        {/* Seamless Action Row */}
                        <div className={'mt-10 flex items-center justify-center space-x-4 w-full'}>
                            <button
                                onClick={() => setShowLogoutConfirm(false)}
                                className={'px-6 py-2.5 rounded-xl text-sm font-bold text-neutral-400 hover:text-white hover:bg-white/5 transition-all duration-300'}
                            >
                                {t('auth.logout_stay', 'Stay Signed In')}
                            </button>
                            <EliteButton
                                type={'button'}
                                color={'red'}
                                onClick={onTriggerLogout}
                                className={'!px-8 !py-3 !rounded-xl !shadow-lg shadow-red-500/20'}
                            >
                                <div className={'flex items-center space-x-2'}>
                                    <FontAwesomeIcon icon={faSignOutAlt} className={'text-xs opacity-70'} />
                                    <span>{t('navigation.sign_out', 'Sign Out')}</span>
                                </div>
                            </EliteButton>
                        </div>

                        {/* Branded Footer */}
                        <div className={'mt-8 flex items-center justify-center space-x-2'}>
                            <div className={'w-6 h-[1px] bg-neutral-800'}></div>
                            <a
                                href={'https://github.com/HimService/Better-Pterodactyl'}
                                target={'_blank'}
                                rel={'noopener nofollow noreferrer'}
                                className={'text-[10px] font-bold text-neutral-700 hover:text-neutral-400 transition-colors tracking-widest no-underline'}
                            >
                                Better Pterodactyl
                            </a>
                            <div className={'w-6 h-[1px] bg-neutral-800'}></div>
                        </div>
                    </UserCard>
                </div>
            </Dialog>
        </NavigationContainer>
    );
};
