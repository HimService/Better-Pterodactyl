import styled, { css } from 'styled-components/macro';

export interface Props {
    hasError?: boolean;
}

const inputStyle = css<Props>`
    background-color: var(--color-background);
    color: var(--color-text);
    border: 1px solid var(--color-card-border);
    border-radius: 6px;
    padding: 10px 12px;
    width: 100%;
    font-size: 0.875rem;
    transition: all 0.2s ease-in-out;

    &:focus {
        outline: none;
        border-color: var(--color-primary);
        box-shadow: 0 0 0 2px rgba(var(--color-primary-rgb, 94, 114, 228), 0.2);
    }

    &:disabled {
        opacity: 0.5;
    }

    ${(props) =>
        props.hasError &&
        css`
            border-color: #dc3545;
            &:focus {
                box-shadow: 0 0 0 2px rgba(220, 53, 69, 0.2);
            }
        `};
`;

const Input = styled.input<Props>`
    ${inputStyle}
`;

const Textarea = styled.textarea<Props>`
    ${inputStyle}
`;

export { Input, Textarea };
