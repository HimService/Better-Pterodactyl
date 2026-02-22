import styled from 'styled-components/macro';
import tw from 'twin.macro';

const Label = styled.label<{ isLight?: boolean }>`
    ${tw`block text-[11px] font-bold tracking-wider uppercase text-neutral-300 mb-1.5`};
    ${(props) => props.isLight && tw`text-neutral-600`};
`;

export default Label;
