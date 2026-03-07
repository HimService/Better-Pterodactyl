import { Action, action, Thunk, thunk } from 'easy-peasy';
import updateAccountEmail from '@/api/account/updateAccountEmail';
import axios from 'axios';

export interface UserData {
    uuid: string;
    username: string;
    email: string;
    language: string;
    rootAdmin: boolean;
    useTotp: boolean;
    points: number;
    economyEnabled: boolean;
    billingEnabled: boolean;
    trashEnabled: boolean;
    createdAt: Date;
    updatedAt: Date;
}

export interface UserStore {
    data?: UserData;
    setUserData: Action<UserStore, UserData>;
    updateUserData: Action<UserStore, Partial<UserData>>;
    updateUserEmail: Thunk<UserStore, { email: string; password: string }, any, UserStore, Promise<void>>;
    refreshPoints: Thunk<UserStore, void, any, UserStore, Promise<void>>;
}

const user: UserStore = {
    data: undefined,
    setUserData: action((state, payload) => {
        state.data = payload;
    }),

    updateUserData: action((state, payload) => {
        // @ts-expect-error limitation of Typescript, can't do much about that currently unfortunately.
        state.data = { ...state.data, ...payload };
    }),

    updateUserEmail: thunk(async (actions, payload) => {
        await updateAccountEmail(payload.email, payload.password);

        actions.updateUserData({ email: payload.email });
    }),

    refreshPoints: thunk(async (actions) => {
        try {
            const { data } = await axios.get('/api/client/economy');
            actions.updateUserData({
                points: data.points,
                economyEnabled: data.settings?.enabled || false,
                billingEnabled: data.settings?.billing?.enabled || false,
                trashEnabled: data.trash_enabled || false,
            });
        } catch (error) {
            console.error('Failed to refresh user points:', error);
        }
    }),
};

export default user;
