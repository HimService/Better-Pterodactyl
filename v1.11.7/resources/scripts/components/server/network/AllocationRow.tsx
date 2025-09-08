import React, { memo, useCallback, useState } from 'react';
import isEqual from 'react-fast-compare';
import tw from 'twin.macro';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faNetworkWired } from '@fortawesome/free-solid-svg-icons';
import InputSpinner from '@/components/elements/InputSpinner';
import { Textarea } from '@/components/elements/Input';
import Can from '@/components/elements/Can';
import { Button } from '@/components/elements/button/index';
import { Allocation } from '@/api/server/getServer';
import styled from 'styled-components/macro';
import { debounce } from 'debounce';
import setServerAllocationNotes from '@/api/server/network/setServerAllocationNotes';
import { useFlashKey } from '@/plugins/useFlash';
import { ServerContext } from '@/state/server';
import CopyOnClick from '@/components/elements/CopyOnClick';
import DeleteAllocationButton from '@/components/server/network/DeleteAllocationButton';
import setPrimaryServerAllocation from '@/api/server/network/setPrimaryServerAllocation';
import getServerAllocations from '@/api/swr/getServerAllocations';
import { ip } from '@/lib/formatters';
import Code from '@/components/elements/Code';

const Card = styled.div`
    ${tw`w-full bg-neutral-100 shadow-md rounded-lg p-4 mt-4`}
    [data-theme='dark'] & {
        ${tw`bg-neutral-900`}
    }
`;

const IconContainer = styled.div`
    ${tw`flex-shrink-0 h-8 w-8 rounded-full bg-neutral-500 flex items-center justify-center`}
`;

const Title = styled.h3`
    ${tw`text-lg font-medium text-neutral-800`}
    [data-theme='dark'] & {
        ${tw`text-neutral-200`}
    }
`;

const Subtitle = styled.p`
    ${tw`text-sm text-neutral-500`}
    [data-theme='dark'] & {
        ${tw`text-neutral-400`}
    }
`;

const NotesTextarea = styled(Textarea)`
    ${tw`bg-neutral-200 hover:border-neutral-400 border-transparent`}
    [data-theme='dark'] & {
        ${tw`bg-neutral-800 hover:border-neutral-600`}
    }
`;

const Label = styled.label`
    ${tw`uppercase text-xs mt-1 text-neutral-400 block px-1 select-none transition-colors duration-150`}
`;

interface Props {
    allocation: Allocation;
}

const AllocationRow = ({ allocation }: Props) => {
    const [loading, setLoading] = useState(false);
    const { clearFlashes, clearAndAddHttpError } = useFlashKey('server:network');
    const uuid = ServerContext.useStoreState((state: any) => state.server.data!.uuid);
    const { mutate } = getServerAllocations();

    const onNotesChanged = useCallback((id: number, notes: string) => {
        mutate((data: any) => data?.map((a: Allocation) => (a.id === id ? { ...a, notes } : a)), false);
    }, []);

    const setAllocationNotes = debounce((notes: string) => {
        setLoading(true);
        clearFlashes();

        setServerAllocationNotes(uuid, allocation.id, notes)
            .then(() => onNotesChanged(allocation.id, notes))
            .catch((error) => clearAndAddHttpError(error))
            .then(() => setLoading(false));
    }, 750);

    const setPrimaryAllocation = () => {
        clearFlashes();
        mutate((data: any) => data?.map((a: Allocation) => ({ ...a, isDefault: a.id === allocation.id })), false);

        setPrimaryServerAllocation(uuid, allocation.id).catch((error) => {
            clearAndAddHttpError(error);
            mutate();
        });
    };

    return (
        <Card>
            <div className="flex items-center mb-4">
                <IconContainer>
                    <FontAwesomeIcon icon={faNetworkWired} className="text-white" />
                </IconContainer>
                <div className="ml-4">
                    <Title>
                        {allocation.alias ? (
                            <CopyOnClick text={allocation.alias}>
                                <span className="truncate">{allocation.alias}</span>
                            </CopyOnClick>
                        ) : (
                            <CopyOnClick text={ip(allocation.ip)}>
                                <span>{ip(allocation.ip)}</span>
                            </CopyOnClick>
                        )}
                    </Title>
                    <Subtitle>
                        {allocation.alias ? '主機名稱' : 'IP 位址'}
                    </Subtitle>
                </div>
                <div className="ml-auto text-right">
                    <Code dark>{allocation.port}</Code>
                    <Subtitle>連接埠</Subtitle>
                </div>
            </div>
            <div className="mt-4">
                <InputSpinner visible={loading}>
                    <NotesTextarea
                        placeholder={'備註'}
                        defaultValue={allocation.notes || undefined}
                        onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setAllocationNotes(e.currentTarget.value)}
                    />
                </InputSpinner>
            </div>
            <div className="flex justify-end space-x-4 mt-4">
                {allocation.isDefault ? (
                    <Button size={Button.Sizes.Small} className={'!text-gray-50 !bg-blue-600'} disabled>
                        主要連線位置
                    </Button>
                ) : (
                    <>
                        <Can action={'allocation.delete'}>
                            <DeleteAllocationButton allocation={allocation.id} />
                        </Can>
                        <Can action={'allocation.update'}>
                            <Button.Text size={Button.Sizes.Small} onClick={setPrimaryAllocation}>
                                設為主要連線位置
                            </Button.Text>
                        </Can>
                    </>
                )}
            </div>
        </Card>
    );
};

export default memo(AllocationRow, isEqual);
