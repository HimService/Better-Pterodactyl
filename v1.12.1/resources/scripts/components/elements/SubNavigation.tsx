import styled from 'styled-components/macro';
import tw from 'twin.macro';

const SubNavigation = styled.div`
    ${tw`w-full overflow-x-auto border-b transition-colors duration-300`};
    background-color: transparent;
    border-color: rgb(var(--border-color, 230 230 230));

    & > div {
        ${tw`flex items-center text-sm mx-auto px-2`};
        max-width: 1200px;

        & > a,
        & > div {
            ${tw`inline-block py-3 px-4 no-underline whitespace-nowrap transition-all duration-150`};
            color: rgb(var(--text-secondary));

            &:not(:first-of-type) {
                ${tw`ml-2`};
            }

            &:hover {
                color: rgb(var(--text-primary));
            }

            &:active,
            &.active {
                color: rgb(var(--text-primary));
                box-shadow: inset 0 -2px rgb(var(--color-brand-600));
            }
        }
    }
`;

export default SubNavigation;
