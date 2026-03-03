import { useState } from 'react';
import sendPowerAction from '@/api/server/sendPowerAction';
import useFlash from '@/plugins/useFlash';

export type BatchStatus = 'pending' | 'processing' | 'success' | 'error';

interface BatchResult {
    [key: string]: BatchStatus;
}

export const useBatchPowerAction = () => {
    const { addFlash, clearFlashes } = useFlash();
    const [isBatching, setIsBatching] = useState(false);
    const [batchResults, setBatchResults] = useState<BatchResult>({});
    const [currentAction, setCurrentAction] = useState<'start' | 'stop' | 'restart' | 'kill' | null>(null);

    const runBatchAction = async (serverIds: string[], action: 'start' | 'stop' | 'restart' | 'kill') => {
        setIsBatching(true);
        setCurrentAction(action);
        clearFlashes('dashboard');

        const initialResults: BatchResult = {};
        serverIds.forEach(id => initialResults[id] = 'processing');
        setBatchResults(initialResults);

        try {
            await Promise.all(
                serverIds.map(async (id) => {
                    try {
                        await sendPowerAction(id, action);
                        setBatchResults(prev => ({ ...prev, [id]: 'success' }));
                    } catch (error: any) {
                        console.error(`Failed batch action for ${id}:`, error);
                        setBatchResults(prev => ({ ...prev, [id]: 'error' }));
                        // We don't throw here so other requests can finish
                    }
                })
            );
        } catch (error: any) {
            addFlash({ key: 'dashboard', type: 'error', message: 'An unexpected error occurred during batch operation.' });
        } finally {
            setIsBatching(false);
            setCurrentAction(null);
            // Optionally clear success results after a delay
            setTimeout(() => setBatchResults({}), 5000);
        }
    };

    return {
        isBatching,
        batchResults,
        currentAction,
        runBatchAction,
    };
};
