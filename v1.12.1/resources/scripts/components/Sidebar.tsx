import React from 'react';
import { NavLink } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faServer, faUserCog, faCogs, faStore } from '@fortawesome/free-solid-svg-icons';
import { useStoreState } from 'easy-peasy';
import { ApplicationStore } from '@/state';
import Tooltip from '@/components/elements/tooltip/Tooltip';
import tw, { styled } from 'twin.macro';
import { useTranslation } from 'react-i18next';
import PluginSlot from '@/components/elements/plugins/PluginSlot';

const SidebarContainer = styled.div`
    ${tw`hidden md:flex flex-col w-20 max-h-screen h-screen sticky top-0 border-r transition-all duration-300 z-[60]`};
    background-color: rgb(var(--bg-app)); /* Matches main body background for a seamless look */
    border-color: rgb(var(--border-color, 230 230 230));
`;

const SidebarNavTop = styled.nav`
    ${tw`flex flex-col flex-1 items-center justify-end py-6 gap-6`};
`;

const SidebarNavBottom = styled.nav`
    ${tw`flex flex-col items-center py-6 mt-auto gap-6`};
`;

const NavItemStyle = styled(NavLink)`
    ${tw`flex items-center justify-center w-12 h-12 rounded-xl transition-all duration-200`};
    color: rgb(var(--text-secondary));

    &:hover {
        color: rgb(var(--text-primary));
        background-color: rgb(var(--bg-card-hover));
        &:active,
        &:hover,
        &.active {
            box-shadow: inset 0 -2px var(--brand-main);
        }
box-shadow: 0 4px 12px var(--brand-glow);
    }

    &.active {
        color: white;
        background-color: var(--brand-main);
        box-shadow: 0 4px 12px var(--brand-glow);
    }
`;

const AdminNavItemStyle = styled.a`
    ${tw`flex items-center justify-center w-12 h-12 rounded-xl transition-all duration-200`};
    color: rgb(var(--text-secondary));

    &:hover {
        color: rgb(var(--text-primary));
        background-color: rgb(var(--bg-card-hover));
    }
`;

const Sidebar = () => {
    const { t } = useTranslation('frontend');
    const rootAdmin = useStoreState((state: ApplicationStore) => state.user.data?.rootAdmin || false);
    const economyEnabled = useStoreState((state: ApplicationStore) => state.user.data?.economyEnabled || false);

    return (
        <SidebarContainer>
            <SidebarNavTop>
                <Tooltip placement="right" content={t('navigation.servers', 'Servers')}>
                    <NavItemStyle to={'/'} exact>
                        <FontAwesomeIcon icon={faServer} size={'lg'} />
                    </NavItemStyle>
                </Tooltip>

                {economyEnabled && (
                    <Tooltip placement="right" content={t('economy.store', 'Resource Store')}>
                        <NavItemStyle to={'/economy'}>
                            <FontAwesomeIcon icon={faStore} size={'lg'} />
                        </NavItemStyle>
                    </Tooltip>
                )}

                <Tooltip placement="right" content={t('navigation.account', 'Account')}>
                    <NavItemStyle to={'/account'}>
                        <FontAwesomeIcon icon={faUserCog} size={'lg'} />
                    </NavItemStyle>
                </Tooltip>

                <PluginSlot id="sidebar" />
            </SidebarNavTop>

            <SidebarNavBottom>
                {rootAdmin && (
                    <Tooltip placement="right" content={t('navigation.admin_panel', 'Admin Panel')}>
                        <AdminNavItemStyle href={'/admin'}>
                            <FontAwesomeIcon icon={faCogs} size={'lg'} />
                        </AdminNavItemStyle>
                    </Tooltip>
                )}
            </SidebarNavBottom>
        </SidebarContainer>
    );
};

export default Sidebar;
