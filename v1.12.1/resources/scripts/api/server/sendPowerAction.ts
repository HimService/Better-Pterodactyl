import http from '@/api/http';

export type PowerAction = 'start' | 'stop' | 'restart' | 'kill';

export default (server: string, action: PowerAction): Promise<void> => {
    return new Promise((resolve, reject) => {
        // Some Pterodactyl variants use 'signal', others use 'action'. Sending both maximizes compatibility.
        http.post(`/api/client/servers/${server}/power`, { action, signal: action })
            .then(() => resolve())
            .catch(reject);
    });
};
