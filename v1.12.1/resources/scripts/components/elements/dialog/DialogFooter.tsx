import React, { useContext } from 'react';
import { DialogContext } from './';
import { useDeepCompareEffect } from '@/plugins/useDeepCompareEffect';

export default ({ children }: { children: React.ReactNode }) => {
    const { setFooter } = useContext(DialogContext);

    useDeepCompareEffect(() => {
        setFooter(
            <div className={'px-6 py-4 bg-neutral-900/80 border-t border-neutral-700/50 flex items-center justify-end space-x-3 rounded-b'}>
                {children}
            </div>
        );
    }, [children]);

    return null;
};
