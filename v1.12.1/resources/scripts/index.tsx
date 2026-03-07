import React from 'react';
import ReactDOM from 'react-dom';
import './i18n';
import App from '@/components/App';
import { setConfig } from 'react-hot-loader';

// Prevents page reloads while making component changes which
// also avoids triggering constant loading indicators all over
// the place in development.
//
// @see https://github.com/gaearon/react-hot-loader#hook-support
setConfig({ reloadHooks: false });

import AdminRadarWrapper from '@/components/admin/AdminRadarWrapper';
import AnnouncementManager from '@/components/admin/AnnouncementManager';
import StatusManager from '@/components/admin/StatusManager';
import EconomyManager from '@/components/admin/EconomyManager';
import DiscordManager from '@/components/admin/DiscordManager';
import PluginManager from '@/components/admin/PluginManager';
import TrashManager from '@/components/admin/TrashManager';
import UpdateManager from '@/components/admin/UpdateManager';
import AnnouncementBanner from '@/components/elements/AnnouncementBanner';

import { StoreProvider } from 'easy-peasy';
import { store } from '@/state';
import { ThemeProvider } from '@/context/ThemeContext';
import GlobalStylesheet from '@/assets/css/GlobalStylesheet';

const appRoot = document.getElementById('app');
if (appRoot) {
    ReactDOM.render(<App />, appRoot);
}

const adminRadarRoot = document.getElementById('admin-radar-root');
if (adminRadarRoot) {
    const isAnnouncements = window.location.pathname.includes('/admin/announcements');
    const isStatus = window.location.pathname.includes('/admin/status');
    const isEconomy = window.location.pathname.includes('/admin/economy');
    const isDiscord = window.location.pathname.includes('/admin/discord');
    const isPlugins = window.location.pathname.includes('/admin/plugins');
    const isTrash = window.location.pathname.includes('/admin/trash');
    const isUpdate = window.location.pathname.includes('/admin/update');

    // @ts-ignore
    ReactDOM.render(
        <StoreProvider store={store}>
            <ThemeProvider>
                <GlobalStylesheet />
                <AnnouncementBanner />
                {isAnnouncements ? <AnnouncementManager /> : (isStatus ? <StatusManager /> : (isEconomy ? <EconomyManager /> : (isDiscord ? <DiscordManager /> : (isPlugins ? <PluginManager /> : (isTrash ? <TrashManager /> : (isUpdate ? <UpdateManager /> : <AdminRadarWrapper />))))))}
            </ThemeProvider>
        </StoreProvider>,
        adminRadarRoot
    );
}
