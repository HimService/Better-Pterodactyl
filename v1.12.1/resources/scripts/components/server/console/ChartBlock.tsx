import React from 'react';
import classNames from 'classnames';
import styles from '@/components/server/console/style.module.css';

interface ChartBlockProps {
    title: string;
    legend?: React.ReactNode;
    children: React.ReactNode;
}

export default ({ title, legend, children }: ChartBlockProps) => (
    <div className={classNames(
        styles.chart_container,
        'group bg-white/5 dark:bg-[#0a0a0c]/80 backdrop-blur-xl border border-black/10 dark:border-white/5 shadow-xl transition-all duration-300 hover:bg-white/10 dark:hover:bg-[#121215]/90 hover:shadow-2xl hover:border-black/20 dark:hover:border-white/10'
    )}>
        <div className={'flex items-center justify-between px-4 py-3 border-b border-black/5 dark:border-white/5'}>
            <h3 className={'font-header font-bold tracking-wide text-xs text-neutral-500 dark:text-neutral-400 uppercase transition-colors duration-300 group-hover:text-neutral-900 dark:group-hover:text-gray-50'}>
                {title}
            </h3>
            {legend && <p className={'text-sm flex items-center'}>{legend}</p>}
        </div>
        <div className={'z-10 ml-2'}>{children}</div>
    </div>
);
