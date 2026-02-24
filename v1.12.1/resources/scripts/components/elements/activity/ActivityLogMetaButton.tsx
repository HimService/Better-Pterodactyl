import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Dialog } from '@/components/elements/dialog';
import { Button } from '@/components/elements/button/index';
import { ClipboardListIcon } from '@heroicons/react/solid';

export default ({ meta }: { meta: Record<string, unknown> }) => {
    const { t } = useTranslation();
    const [open, setOpen] = useState(false);

    return (
        <div className={'self-center md:px-4'}>
            <Dialog open={open} onClose={() => setOpen(false)} hideCloseIcon title={t('global.metadata', 'Metadata')}>
                <pre
                    className={
                        'bg-neutral-800 text-neutral-100 dark:bg-gray-900 dark:text-gray-50 rounded p-2 font-mono text-sm leading-relaxed overflow-x-scroll whitespace-pre-wrap'
                    }
                >
                    {JSON.stringify(meta, null, 2)}
                </pre>
                <Dialog.Footer>
                    <Button.Text onClick={() => setOpen(false)}>{t('global.close')}</Button.Text>
                </Dialog.Footer>
            </Dialog>
            <button
                aria-describedby={'View additional event metadata'}
                className={
                    'p-2 transition-colors duration-100 text-neutral-400 hover:text-neutral-600 dark:text-gray-400 dark:group-hover:text-gray-300 dark:group-hover:hover:text-gray-50'
                }
                onClick={() => setOpen(true)}
            >
                <ClipboardListIcon className={'w-5 h-5'} />
            </button>
        </div>
    );
};
