import React from 'react';
import ReactDOM from 'react-dom';
import App from '@/components/App';
import { setConfig } from 'react-hot-loader';

// Enable language support.
import './i18n';

// Prevents page reloads while making component changes which
// also avoids triggering constant loading indicators all over
// the place in development.
//
// @see https://github.com/gaearon/react-hot-loader#hook-support
setConfig({ reloadHooks: false });

import AdminRadarWrapper from '@/components/admin/AdminRadarWrapper';

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
    // @ts-ignore
    ReactDOM.render(
        <StoreProvider store={store}>
            <ThemeProvider>
                <AdminRadarWrapper />
            </ThemeProvider>
        </StoreProvider>,
        adminRadarRoot
    );
}
