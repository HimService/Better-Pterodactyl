import { createStore, createTypedHooks } from 'easy-peasy';
import flashes, { FlashStore } from '@/state/flashes';
import user, { UserStore } from '@/state/user';
import servers, { ServerStore } from '@/state/servers';
import permissions, { GloablPermissionsStore } from '@/state/permissions';
import settings, { SettingsStore } from '@/state/settings';
import progress, { ProgressStore } from '@/state/progress';

export interface ApplicationStore {
    permissions: GloablPermissionsStore;
    flashes: FlashStore;
    user: UserStore;
    settings: SettingsStore;
    progress: ProgressStore;
    servers: ServerStore;
}

const state: ApplicationStore = {
    permissions,
    flashes,
    user,
    settings,
    progress,
    servers,
};

export const store = createStore(state);

const { useStoreState, useStoreActions } = createTypedHooks<ApplicationStore>();

export { useStoreState, useStoreActions };
