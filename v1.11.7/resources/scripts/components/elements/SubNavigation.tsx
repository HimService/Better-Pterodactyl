import styled from 'styled-components/macro';

const SubNavigation = styled.div`
    width: 100%;
    background-color: var(--color-card-bg);
    border-bottom: 1px solid var(--color-card-border);
    overflow-x: auto;

    & > div {
        display: flex;
        align-items: center;
        font-size: 0.875rem;
        margin: 0 auto;
        padding: 0 1rem;
        max-width: 1200px;

        & > a,
        & > div {
            display: inline-block;
            padding: 1rem 1.25rem;
            color: var(--color-text);
            text-decoration: none;
            white-space: nowrap;
            transition: all 0.2s ease-in-out;
            border-bottom: 2px solid transparent;

            &:hover {
                color: var(--color-primary);
            }

            &:active,
            &.active {
                color: var(--color-primary);
                border-bottom-color: var(--color-primary);
            }
        }
    }
`;

export default SubNavigation;
