import useSWR from 'swr';
import http from '@/api/http';

export interface Plugin {
    id: number;
    name: string;
    description: string;
    slot: string;
    type: string;
    enabled: boolean;
    config: any;
}

export const usePlugins = () => {
    return useSWR<Record<string, Plugin[]>>('/api/client/plugins', (url) =>
        http.get(url).then((res) => res.data)
    );
};
