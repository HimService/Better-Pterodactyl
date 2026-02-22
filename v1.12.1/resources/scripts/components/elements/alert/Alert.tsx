import { ExclamationIcon, ShieldExclamationIcon } from '@heroicons/react/outline';
import React from 'react';
import classNames from 'classnames';

interface AlertProps {
    type: 'warning' | 'danger';
    className?: string;
    children: React.ReactNode;
}

export default ({ type, className, children }: AlertProps) => {
    return (
        <div
            className={classNames(
                'flex items-center border-l-4 rounded-r-xl shadow-sm px-4 py-3 text-sm font-medium transition-colors',
                {
                    ['border-red-500 bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-200']: type === 'danger',
                    ['border-yellow-500 bg-yellow-100 text-yellow-800 dark:bg-yellow-900/40 dark:text-yellow-200']: type === 'warning',
                },
                className
            )}
        >
            {type === 'danger' ? (
                <ShieldExclamationIcon className={'w-5 h-5 text-red-500 dark:text-red-400 mr-3 flex-shrink-0'} />
            ) : (
                <ExclamationIcon className={'w-5 h-5 text-yellow-600 dark:text-yellow-500 mr-3 flex-shrink-0'} />
            )}
            {children}
        </div>
    );
};
