import { Server } from '@/api/server/getServer';

export interface ServerStore {
    data: Server[];
    setServers: (servers: Server[]) => void;
}

const servers: ServerStore = {
    data: [],
    setServers: (servers) => {
        servers;
    },
};

export default servers;