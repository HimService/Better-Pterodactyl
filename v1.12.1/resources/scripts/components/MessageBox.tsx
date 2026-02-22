import * as React from 'react';
import tw, { TwStyle } from 'twin.macro';
import styled from 'styled-components/macro';

export type FlashMessageType = 'success' | 'info' | 'warning' | 'error';

interface Props {
    title?: string;
    children: string;
    type?: FlashMessageType;
}

const styling = (type?: FlashMessageType): TwStyle | string => {
    switch (type) {
        case 'error':
            return tw`bg-red-100 border-red-500 text-red-800 dark:bg-red-900/40 dark:text-red-200`;
        case 'info':
            return tw`bg-primary-100 border-primary-500 text-primary-800 dark:bg-primary-900/40 dark:text-primary-200`;
        case 'success':
            return tw`bg-green-100 border-green-500 text-green-800 dark:bg-green-900/40 dark:text-green-200`;
        case 'warning':
            return tw`bg-yellow-100 border-yellow-500 text-yellow-800 dark:bg-yellow-900/40 dark:text-yellow-200`;
        default:
            return '';
    }
};

const getBackground = (type?: FlashMessageType): TwStyle | string => {
    switch (type) {
        case 'error':
            return tw`bg-red-500 text-white`;
        case 'info':
            return tw`bg-primary-500 text-white`;
        case 'success':
            return tw`bg-green-500 text-white`;
        case 'warning':
            return tw`bg-yellow-500 text-white`;
        default:
            return '';
    }
};

const Container = styled.div<{ $type?: FlashMessageType }>`
    ${tw`p-3 border-l-4 rounded-r-xl items-center leading-normal shadow-sm flex w-full text-sm font-medium transition-colors`};
    ${(props) => styling(props.$type)};
`;
Container.displayName = 'MessageBox.Container';

const MessageBox = ({ title, children, type }: Props) => (
    <Container css={tw`lg:inline-flex`} $type={type} role={'alert'}>
        {title && (
            <span
                className={'title'}
                css={[
                    tw`flex rounded-full uppercase px-2 py-1 text-xs font-bold mr-3 leading-none`,
                    getBackground(type),
                ]}
            >
                {title}
            </span>
        )}
        <span css={tw`mr-2 text-left flex-auto`}>{children}</span>
    </Container>
);
MessageBox.displayName = 'MessageBox';

export default MessageBox;
