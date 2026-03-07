import http from '@/api/http';
import { rawDataToFileObject } from '@/api/transformers';
import { FileObject } from '@/api/server/files/loadDirectory';

export default async (uuid: string): Promise<FileObject[]> => {
    const { data } = await http.get(`/api/client/servers/${uuid}/files/list`, {
        params: { directory: '.bp_trash' },
    });

    return (data.data || []).map(rawDataToFileObject);
};
