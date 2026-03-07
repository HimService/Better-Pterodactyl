import http from '@/api/http';

export default (uuid: string, files: string[]): Promise<void> => {
    return new Promise((resolve, reject) => {
        http.post(`/api/client/servers/${uuid}/trash/restore`, { files })
            .then(() => resolve())
            .catch(reject);
    });
};
