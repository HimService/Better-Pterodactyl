import styled, { css } from 'styled-components/macro';
import tw from 'twin.macro';

export default styled.div<{ $hoverable?: boolean }>`
    ${tw`flex no-underline items-center p-5 transition-all duration-300 overflow-hidden backdrop-blur-md`};
    background-color: rgba(var(--bg-card), 0.85);
    border: 1px solid rgba(var(--border-color), 0.5);
    border-radius: var(--radius-card, 0.75rem);
    color: rgb(var(--text-secondary));
    box-shadow: var(--shadow-card);

    ${(props) => props.$hoverable !== false && css`
        &:hover {
            background-color: rgba(var(--bg-card-hover), 0.95);
            border-color: rgba(var(--color-brand-500), 0.5);
            box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
            transform: translateY(-2px);
        }
    `};

    & .icon {
        ${tw`rounded-xl w-14 h-14 flex items-center justify-center transition-colors duration-300`};
        background-color: rgba(var(--color-brand-500), 0.1);
        color: rgb(var(--color-brand-600));
    }
`;
