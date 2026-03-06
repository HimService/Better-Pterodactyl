import React from 'react';
import Icon from '@/components/elements/Icon';
import { IconDefinition } from '@fortawesome/free-solid-svg-icons';
import classNames from 'classnames';
import styles from './style.module.css';
import useFitText from 'use-fit-text';
import CopyOnClick from '@/components/elements/CopyOnClick';

interface StatBlockProps {
    title: string;
    copyOnClick?: string;
    color?: string | undefined;
    icon: IconDefinition;
    children: React.ReactNode;
    className?: string;
}

export default ({ title, copyOnClick, icon, color, className, children }: StatBlockProps) => {
    const { fontSize, ref } = useFitText({ minFontSize: 8, maxFontSize: 500 });

    return (
        <CopyOnClick text={copyOnClick}>
            <div className={classNames(
                styles.stat_block,
                className,
                'bg-white/80 dark:bg-[#0a0a0c]/80 backdrop-blur-xl border border-black/10 dark:border-white/5 shadow-xl transition-all duration-300 hover:bg-white dark:hover:bg-[#121215]/90 hover:shadow-2xl hover:border-black/20 dark:hover:border-white/10 group cursor-pointer'
            )}>
                <div className={classNames(styles.status_bar, color || 'bg-neutral-400 dark:bg-gray-600')} />
                <div className={classNames(
                    styles.icon,
                    !color || color === 'bg-neutral-300 dark:bg-gray-700'
                        ? 'bg-gradient-to-br from-neutral-200 to-neutral-300 dark:from-gray-700 dark:to-gray-800 border border-black/5 dark:border-white/5 box-border'
                        : color.replace('bg-', 'from-').replace('-500', '-400') + ' to-' + color.replace('bg-', '').replace('-500', '-600') + ' bg-gradient-to-br border border-white/10'
                )}>
                    <Icon
                        icon={icon}
                        className={classNames({
                            'text-neutral-500 dark:text-gray-300': !color || color === 'bg-neutral-300 dark:bg-gray-700',
                            'text-white': color && color !== 'bg-neutral-300 dark:bg-gray-700',
                        })}
                    />
                </div>
                <div className={'flex flex-col justify-center overflow-hidden w-full relative z-10'}>
                    <p className={'font-header font-semibold tracking-wide leading-tight text-[11px] md:text-xs text-neutral-500 uppercase'}>{title}</p>
                    <div
                        ref={ref}
                        className={'h-[1.75rem] w-full font-bold text-neutral-800 dark:text-gray-50 truncate transition-colors duration-300 group-hover:text-brand-500'}
                        style={{ fontSize }}
                    >
                        {children}
                    </div>
                </div>
            </div>
        </CopyOnClick>
    );
};
