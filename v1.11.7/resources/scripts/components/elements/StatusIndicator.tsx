import React from 'react';
import { ServerPowerState } from '@/api/server/getServerResourceUsage';
import tw from 'twin.macro';
import styled from 'styled-components/macro';

const StatusIndicatorBox = styled.div<{ $status: ServerPowerState | undefined }>`
    ${tw`w-3 h-3 rounded-full bg-red-500 transition-colors duration-150`};

    ${({ $status }) =>
        !$status || $status === 'offline'
            ? tw`bg-red-500`
            : $status === 'running'
            ? tw`bg-green-500`
            : tw`bg-yellow-500`};
`;

export default ({ status }: { status: ServerPowerState | undefined }) => {
    return <StatusIndicatorBox $status={status} />;
};