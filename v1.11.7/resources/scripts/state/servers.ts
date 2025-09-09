import { action, Action } from 'easy-peasy';
import { Server as BaseServer } from '@/api/server/getServer';
import { ServerResources } from '@/components/dashboard/ServerRow';
import { ServerPowerState } from '@/api/server/getServerResourceUsage';

export type Server = BaseServer & { resources?: ServerResources };

export interface ServerStore {
    data: Server[];
    setServers: Action<ServerStore, Server[]>;
    setServerResources: Action<ServerStore, { uuid: string; resources: ServerResources }>;
    setServerStatus: Action<ServerStore, { uuid: string; status: ServerPowerState }>;
}

const servers: ServerStore = {
    data: [],

    setServers: action((state, payload) => {
        state.data = payload;
    }),

    setServerResources: action((state, payload) => {
        const server = state.data.find((s) => s.uuid === payload.uuid);
        if (server) {
            server.resources = payload.resources;
        }
    }),

    setServerStatus: action((state, payload) => {
        const server = state.data.find((s) => s.uuid === payload.uuid);
        if (server) {
            if (server.resources) {
                server.resources.status = payload.status;
            } else {
                server.resources = {
                    status: payload.status,
                    cpu_absolute: 0,
                    memory_bytes: 0,
                    disk_bytes: 0,
                };
            }
        }
    }),
};

export default servers;