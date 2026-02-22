import styled, { css } from 'styled-components/macro';
import tw from 'twin.macro';

export interface Props {
    isLight?: boolean;
    hasError?: boolean;
}

const light = css<Props>`
    background-color: rgb(var(--bg-card));
    border-color: rgb(var(--border-color));
    color: rgb(var(--text-primary));

    &:focus {
        border-color: rgb(var(--color-brand-400));
    }

    &:disabled {
        background-color: rgb(var(--bg-app));
        border-color: rgb(var(--border-color));
    }
`;

const checkboxStyle = css<Props>`
    ${tw`cursor-pointer appearance-none inline-block align-middle select-none flex-shrink-0 w-5 h-5 rounded`};
    background-color: rgb(var(--bg-card-hover));
    border: 1px solid rgb(var(--border-color));
    color-adjust: exact;
    background-origin: border-box;
    transition: all 150ms ease-in-out;

    &:checked {
        border-color: transparent;
        background-image: url("data:image/svg+xml,%3csvg viewBox='0 0 16 16' fill='white' xmlns='http://www.w3.org/2000/svg'%3e%3cpath d='M5.707 7.293a1 1 0 0 0-1.414 1.414l2 2a1 1 0 0 0 1.414 0l4-4a1 1 0 0 0-1.414-1.414L7 8.586 5.707 7.293z'/%3e%3c/svg%3e");
        background-color: rgb(var(--color-brand-600));
        background-size: 100% 100%;
    }

    &:focus {
        ${tw`outline-none`};
        border-color: rgb(var(--color-brand-400));
        box-shadow: 0 0 0 3px rgb(var(--color-brand-500) / 0.25);
    }
`;

const inputStyle = css<Props>`
    // Reset to normal styling.
    resize: none;
    ${tw`appearance-none outline-none w-full min-w-0`};
    ${tw`px-4 py-3 rounded-xl text-sm transition-all duration-300`};
    ${tw`bg-neutral-100/50 dark:bg-black/20 border border-neutral-300 dark:border-neutral-700`};
    color: rgb(var(--text-primary));
    box-shadow: inset 0 1px 2px 0 rgba(0, 0, 0, 0.05);

    & + .input-help {
        ${tw`mt-1.5 text-xs`};
        color: rgb(var(--text-secondary));
        ${(props) => props.hasError && tw`text-red-500`};
    }

    &:required,
    &:invalid {
        box-shadow: none;
    }

    &:hover:not(:disabled):not(:focus):not(:read-only) {
        ${tw`border-neutral-400 dark:border-neutral-600 bg-neutral-100 dark:bg-black/40`};
    }

    &:not(:disabled):not(:read-only):focus {
        ${tw`bg-white dark:bg-black/60`};
        border-color: rgb(var(--color-brand-500));
        box-shadow: 0 0 0 3px rgb(var(--color-brand-500) / 0.25), inset 0 1px 2px 0 rgba(0, 0, 0, 0.1);
        ${(props) => props.hasError && tw`border-red-500`};
        ${(props) => props.hasError && `box-shadow: 0 0 0 3px rgba(239, 68, 68, 0.25);`};
    }

    &:disabled {
        opacity: 0.6;
        cursor: not-allowed;
        ${tw`bg-neutral-200 dark:bg-neutral-800`};
    }

    ${(props) => props.isLight && light};
    ${(props) => props.hasError && tw`text-red-500 border-red-500 hover:border-red-400`};
`;

const Input = styled.input<Props>`
    &:not([type='checkbox']):not([type='radio']) {
        ${inputStyle};
    }

    &[type='checkbox'],
    &[type='radio'] {
        ${checkboxStyle};

        &[type='radio'] {
            ${tw`rounded-full`};
        }
    }
`;
const Textarea = styled.textarea<Props>`
    ${inputStyle}
`;

export { Textarea };
export default Input;
