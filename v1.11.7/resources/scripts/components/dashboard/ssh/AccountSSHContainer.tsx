import React, { useEffect } from 'react';
import TitledGreyBox from '@/components/elements/TitledGreyBox';
import SpinnerOverlay from '@/components/elements/SpinnerOverlay';
import FlashMessageRender from '@/components/FlashMessageRender';
import PageContentBlock from '@/components/elements/PageContentBlock';
import tw from 'twin.macro';
import { useSSHKeys } from '@/api/account/ssh-keys';
import { useFlashKey } from '@/plugins/useFlash';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faKey } from '@fortawesome/free-solid-svg-icons';
import { format } from 'date-fns';
import CreateSSHKeyForm from '@/components/dashboard/ssh/CreateSSHKeyForm';
import DeleteSSHKeyButton from '@/components/dashboard/ssh/DeleteSSHKeyButton';

export default () => {
    const { clearAndAddHttpError } = useFlashKey('account');
    const { data, isValidating, error } = useSSHKeys({
        revalidateOnMount: true,
        revalidateOnFocus: false,
    });

    useEffect(() => {
        clearAndAddHttpError(error);
    }, [error]);

    return (
        <PageContentBlock title={'SSH 金鑰'}>
            <FlashMessageRender byKey={'account'} />
            <div css={tw`md:grid md:grid-cols-2 gap-8 my-10`}>
                <TitledGreyBox title={'新增 SSH 金鑰'}>
                    <CreateSSHKeyForm />
                </TitledGreyBox>
                <TitledGreyBox title={'SSH 金鑰'}>
                    <SpinnerOverlay visible={!data && isValidating} />
                    {!data || !data.length ? (
                        <p css={tw`text-center text-sm`}>
                            {!data ? '載入中...' : '此帳戶不存在 SSH 金鑰。'}
                        </p>
                    ) : (
                        data.map((key, index) => (
                            <div
                                key={key.fingerprint}
                                css={[tw`flex space-x-4 items-center`, index > 0 && tw`mt-2`]}
                            >
                                <FontAwesomeIcon icon={faKey} css={tw`text-neutral-300`} />
                                <div css={tw`flex-1`}>
                                    <p css={tw`text-sm break-words font-medium`}>{key.name}</p>
                                    <p css={tw`text-xs mt-1 font-mono truncate`}>SHA256:{key.fingerprint}</p>
                                    <p css={tw`text-xs mt-1 text-neutral-300 uppercase`}>
                                        新增於：&nbsp;
                                        {format(key.createdAt, 'MMM do, yyyy HH:mm')}
                                    </p>
                                </div>
                                <DeleteSSHKeyButton name={key.name} fingerprint={key.fingerprint} />
                            </div>
                        ))
                    )}
                </TitledGreyBox>
            </div>
        </PageContentBlock>
    );
};
