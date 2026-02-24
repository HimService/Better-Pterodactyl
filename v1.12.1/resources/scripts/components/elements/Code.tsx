import React from 'react';
import classNames from 'classnames';

interface CodeProps {
    dark?: boolean | undefined;
    className?: string;
    children: React.ReactChild | React.ReactFragment | React.ReactPortal;
}

export default ({ dark, className, children }: CodeProps) => (
    <code
        className={classNames('font-mono text-xs px-2 py-1 inline-block rounded-lg shadow-inner transition-colors duration-300', className, {
            'bg-indigo-500/10 text-indigo-400 border border-indigo-500/10': !dark,
            'bg-neutral-900 text-indigo-300 border border-indigo-500/20': dark,
        })}
    >
        {children}
    </code>
);
