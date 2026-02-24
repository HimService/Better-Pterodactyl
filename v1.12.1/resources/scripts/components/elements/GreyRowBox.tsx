import styled, { css } from 'styled-components/macro';
import tw from 'twin.macro';

export default styled.div<{ $hoverable?: boolean }>`
    ${tw`flex no-underline items-center p-5 transition-all duration-300 overflow-hidden backdrop-blur-md`};
    background-color: rgba(var(--bg-card), 0.85);
    border: 1px solid rgba(var(--border-color), 0.5);
    border-radius: var(--radius-card, 1.5rem);
    color: rgb(var(--text-secondary));
    box-shadow: var(--shadow-card);

    ${(props) => props.$hoverable !== false && css`
        &:hover {
            background-color: rgba(var(--bg-card-hover), 0.95);
            border-color: rgba(var(--color-brand-500), 0.5);
            box-shadow: 0 10px 30px rgba(0, 0, 0, 0.15);
            transform: translateY(-4px);
        }
    `};

    & .icon {
        ${tw`rounded-2xl w-14 h-14 flex items-center justify-center transition-all duration-300 shadow-inner`};
        background-color: rgba(var(--color-brand-500), 0.15);
        color: rgb(var(--color-brand-400));
        border: 1px solid rgba(var(--color-brand-500), 0.1);
    }
`;
