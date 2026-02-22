import React, { memo } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { IconProp } from '@fortawesome/fontawesome-svg-core';
import tw from 'twin.macro';
import { css } from 'styled-components/macro';
import isEqual from 'react-fast-compare';

interface Props {
    icon?: IconProp;
    title: string | React.ReactNode;
    className?: string;
    children: React.ReactNode;
}

const TitledGreyBox = ({ icon, title, children, className }: Props) => (
    <div
        css={[
            tw`overflow-hidden transition-all duration-300 backdrop-blur-md`,
            css`
                background-color: rgba(var(--bg-card), 0.85);
                border: 1px solid rgba(var(--border-color), 0.5);
                border-radius: var(--radius-card);
                box-shadow: var(--shadow-card);
            `,
        ]}
        className={className}
    >
        <div
            css={[
                tw`px-5 py-4 border-b`,
                css`
                    border-color: rgba(var(--border-color), 0.5);
                    background-color: transparent;
                `
            ]}
        >
            {typeof title === 'string' ? (
                <p css={[tw`text-base font-semibold`, css`color: rgb(var(--text-primary));`]}>
                    {icon && <FontAwesomeIcon icon={icon} css={[tw`mr-3`, css`color: rgb(var(--text-secondary));`]} />}
                    {title}
                </p>
            ) : (
                title
            )}
        </div>
        <div css={[tw`p-5 leading-relaxed`, css`color: rgb(var(--text-secondary));`]}>{children}</div>
    </div>
);

export default memo(TitledGreyBox, isEqual);
