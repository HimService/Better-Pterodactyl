import React from 'react';
import styled, { css } from 'styled-components/macro';
import tw from 'twin.macro';
import Spinner from '@/components/elements/Spinner';

interface Props {
    isLoading?: boolean;
    size?: 'xsmall' | 'small' | 'large' | 'xlarge';
    color?: 'green' | 'red' | 'primary' | 'grey';
    isSecondary?: boolean;
}

const ButtonStyle = styled.button<Omit<Props, 'isLoading'>>`
    position: relative;
    display: inline-block;
    border-radius: 6px;
    padding: 8px 16px;
    font-weight: 600;
    font-size: 0.875rem;
    text-transform: uppercase;
    letter-spacing: 1px;
    transition: all 0.2s ease-in-out;
    border: none;
    cursor: pointer;

    &:hover:not(:disabled) {
        transform: translateY(-2px);
        box-shadow: 0 4px 10px rgba(0, 0, 0, 0.1);
    }

    &:disabled {
        opacity: 0.55;
        cursor: default;
    }

    ${(props) =>
        ((!props.isSecondary && !props.color) || props.color === 'primary') &&
        css`
            background-color: var(--color-primary);
            color: #ffffff;

            &:hover:not(:disabled) {
                background-color: var(--color-primary-hover);
            }
        `};

    ${(props) =>
        props.color === 'grey' &&
        css`
            background-color: var(--color-muted);
            color: #ffffff;

            &:hover:not(:disabled) {
                background-color: var(--color-muted-hover);
            }
        `};

    ${(props) =>
        props.color === 'green' &&
        css`
            background-color: #28a745;
            color: #ffffff;

            &:hover:not(:disabled) {
                background-color: #218838;
            }
        `};

    ${(props) =>
        props.color === 'red' &&
        css`
            background-color: #dc3545;
            color: #ffffff;

            &:hover:not(:disabled) {
                background-color: #c82333;
            }
        `};

    ${(props) => props.size === 'xsmall' && `padding: 4px 8px; font-size: 0.75rem;`};
    ${(props) => (!props.size || props.size === 'small') && `padding: 8px 16px;`};
    ${(props) => props.size === 'large' && `padding: 12px 24px; font-size: 1rem;`};
    ${(props) => props.size === 'xlarge' && `padding: 16px 32px; font-size: 1.125rem; width: 100%;`};

    ${(props) =>
        props.isSecondary &&
        css`
            background-color: transparent;
            border: 1px solid var(--color-card-border);
            color: var(--color-text);

            &:hover:not(:disabled) {
                background-color: var(--color-background);
                border-color: var(--color-primary);
                color: var(--color-primary);
            }
        `};
`;

type ComponentProps = Omit<JSX.IntrinsicElements['button'], 'ref' | keyof Props> & Props;

const Button: React.FC<ComponentProps> = ({ children, isLoading, ...props }) => (
    <ButtonStyle {...props}>
        {isLoading && (
            <div css={tw`flex absolute justify-center items-center w-full h-full left-0 top-0`}>
                <Spinner size={'small'} />
            </div>
        )}
        <span css={isLoading ? tw`text-transparent` : undefined}>{children}</span>
    </ButtonStyle>
);

type LinkProps = Omit<JSX.IntrinsicElements['a'], 'ref' | keyof Props> & Props;

const LinkButton: React.FC<LinkProps> = (props) => <ButtonStyle as={'a'} {...props} />;

export { LinkButton, ButtonStyle };
export default Button;
