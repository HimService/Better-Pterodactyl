import React, { useEffect, useState } from 'react';
import TitledGreyBox from '@/components/elements/TitledGreyBox';
import CreateApiKeyForm from '@/components/dashboard/forms/CreateApiKeyForm';
import getApiKeys, { ApiKey } from '@/api/account/getApiKeys';
import SpinnerOverlay from '@/components/elements/SpinnerOverlay';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faKey, faTrashAlt } from '@fortawesome/free-solid-svg-icons';
import deleteApiKey from '@/api/account/deleteApiKey';
import FlashMessageRender from '@/components/FlashMessageRender';
import { format } from 'date-fns';
import PageContentBlock from '@/components/elements/PageContentBlock';
import tw from 'twin.macro';
import { Dialog } from '@/components/elements/dialog';
import { useFlashKey } from '@/plugins/useFlash';
import Code from '@/components/elements/Code';

export default () => {
    const [deleteIdentifier, setDeleteIdentifier] = useState('');
    const [keys, setKeys] = useState<ApiKey[]>([]);
    const [loading, setLoading] = useState(true);
    const { clearAndAddHttpError } = useFlashKey('account');

    useEffect(() => {
        getApiKeys()
            .then((keys) => setKeys(keys))
            .then(() => setLoading(false))
            .catch((error) => clearAndAddHttpError(error));
    }, []);

    const doDeletion = (identifier: string) => {
        setLoading(true);

        clearAndAddHttpError();
        deleteApiKey(identifier)
            .then(() => setKeys((s) => [...(s || []).filter((key) => key.identifier !== identifier)]))
            .catch((error) => clearAndAddHttpError(error))
            .then(() => {
                setLoading(false);
                setDeleteIdentifier('');
            });
    };

    return (
        <PageContentBlock title={'帳戶 API'}>
            <FlashMessageRender byKey={'account'} />
            <div css={tw`md:grid md:grid-cols-2 gap-8 my-10`}>
                <TitledGreyBox title={'建立 API 金鑰'}>
                    <CreateApiKeyForm onKeyCreated={(key) => setKeys((s) => [...s!, key])} />
                </TitledGreyBox>
                <TitledGreyBox title={'API 金鑰'}>
                    <SpinnerOverlay visible={loading} />
                    <Dialog.Confirm
                        title={'刪除 API 金鑰'}
                        confirm={'刪除金鑰'}
                        open={!!deleteIdentifier}
                        onClose={() => setDeleteIdentifier('')}
                        onConfirmed={() => doDeletion(deleteIdentifier)}
                    >
                        所有使用 <Code>{deleteIdentifier}</Code> 金鑰的請求都將失效。
                    </Dialog.Confirm>
                    {keys.length === 0 ? (
                        <p css={tw`text-center text-sm`}>
                            {loading ? '載入中...' : '此帳戶不存在 API 金鑰。'}
                        </p>
                    ) : (
                        keys.map((key, index) => (
                            <div
                                key={key.identifier}
                                css={[tw`flex items-center`, index > 0 && tw`mt-2`]}
                            >
                                <FontAwesomeIcon icon={faKey} css={tw`text-neutral-300`} />
                                <div css={tw`ml-4 flex-1 overflow-hidden`}>
                                    <p css={tw`text-sm break-words`}>{key.description}</p>
                                    <p css={tw`text-2xs text-neutral-300 uppercase`}>
                                        上次使用：&nbsp;
                                        {key.lastUsedAt ? format(key.lastUsedAt, 'MMM do, yyyy HH:mm') : '從未使用'}
                                    </p>
                                </div>
                                <p css={tw`text-sm ml-4 hidden md:block`}>
                                    <code css={tw`font-mono py-1 px-2 bg-neutral-900 rounded`}>{key.identifier}</code>
                                </p>
                                <button css={tw`ml-4 p-2 text-sm`} onClick={() => setDeleteIdentifier(key.identifier)}>
                                    <FontAwesomeIcon
                                        icon={faTrashAlt}
                                        css={tw`text-neutral-400 hover:text-red-400 transition-colors duration-150`}
                                    />
                                </button>
                            </div>
                        ))
                    )}
                </TitledGreyBox>
            </div>
        </PageContentBlock>
    );
};
