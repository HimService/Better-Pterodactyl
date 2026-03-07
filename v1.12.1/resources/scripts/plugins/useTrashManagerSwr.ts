import useSWR from 'swr';
import loadDirectory, { FileObject } from '@/api/server/files/loadDirectory';
import { ServerContext } from '@/state/server';
import { getDirectorySwrKey } from '@/plugins/useFileManagerSwr';

export default () => {
    const uuid = ServerContext.useStoreState((state) => state.server.data!.uuid);

    return useSWR<FileObject[]>(
        getDirectorySwrKey(uuid, '.bp_trash'),
        () => loadDirectory(uuid, '.bp_trash'),
        {
            focusThrottleInterval: 60000,
            revalidateOnFocus: false,
            refreshInterval: 0,
            errorRetryCount: 3,
        }
    );
};
