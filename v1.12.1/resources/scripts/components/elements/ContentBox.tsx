import React from 'react';
import FlashMessageRender from '@/components/FlashMessageRender';
import SpinnerOverlay from '@/components/elements/SpinnerOverlay';
import tw from 'twin.macro';
import { css } from 'styled-components/macro';

type Props = Readonly<
    React.DetailedHTMLProps<React.HTMLAttributes<HTMLDivElement>, HTMLDivElement> & {
        title?: string;
        borderColor?: string;
        showFlashes?: string | boolean;
        showLoadingOverlay?: boolean;
    }
>;

const ContentBox = ({ title, borderColor, showFlashes, showLoadingOverlay, children, ...props }: Props) => (
    <div {...props}>
        {title && <h2 css={[tw`mb-4 px-2 text-2xl font-bold tracking-tight`, css`color: rgb(var(--text-primary));`]}>{title}</h2>}
        {showFlashes && (
            <FlashMessageRender byKey={typeof showFlashes === 'string' ? showFlashes : undefined} css={tw`mb-4`} />
        )}
        <div
            css={[
                tw`p-6 relative transition-all duration-300 backdrop-blur-md`,
                !!borderColor && tw`border-t-[4px]`,
                css`
                    background-color: rgba(var(--bg-card), 0.85);
                    border: 1px solid rgba(var(--border-color), 0.5);
                    border-radius: var(--radius-card);
                    box-shadow: var(--shadow-card);
                    ${borderColor && `border-top-color: ${borderColor} !important;`}
                `
            ]}
        >
            <SpinnerOverlay visible={showLoadingOverlay || false} />
            <div css={css`color: rgb(var(--text-secondary));`}>
                {children}
            </div>
        </div>
    </div>
);

export default ContentBox;
