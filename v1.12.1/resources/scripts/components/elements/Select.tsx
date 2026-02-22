import styled, { css } from 'styled-components/macro';
import tw from 'twin.macro';

interface Props {
    hideDropdownArrow?: boolean;
}

const Select = styled.select<Props>`
    ${tw`shadow-none block px-4 py-2.5 pr-10 border w-full rounded-xl text-sm transition-all duration-200 ease-in-out`};
    background-color: rgb(var(--input-bg));
    border-color: rgb(var(--input-border));
    color: rgb(var(--text-primary));
    box-shadow: 0 1px 2px 0 rgb(0 0 0 / 0.05);

    &,
    &:hover:not(:disabled),
    &:focus {
        ${tw`outline-none`};
    }

    -webkit-appearance: none;
    -moz-appearance: none;
    background-size: 1rem;
    background-repeat: no-repeat;
    background-position-x: calc(100% - 1rem);
    background-position-y: center;

    &::-ms-expand {
        display: none;
    }

    &:hover:not(:disabled):not(:focus) {
        border-color: rgb(var(--text-muted));
    }

    &:focus {
        border-color: rgb(var(--color-brand-500));
        box-shadow: 0 0 0 3px rgb(var(--color-brand-500) / 0.25);
    }
    
    &:disabled {
        opacity: 0.6;
        cursor: not-allowed;
        background-color: rgb(var(--bg-app));
    }

    ${(props) =>
        !props.hideDropdownArrow &&
        css`
            background-image: url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 20 20'%3e%3cpath fill='%236b7280' d='M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z'/%3e%3c/svg%3e ");
        `};
`;

export default Select;
