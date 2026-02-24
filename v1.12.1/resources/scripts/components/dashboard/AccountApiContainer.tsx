import React, { useEffect, useState } from 'react';
import ContentBox from '@/components/elements/ContentBox';
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
import GreyRowBox from '@/components/elements/GreyRowBox';
import { Dialog } from '@/components/elements/dialog';
import { useFlashKey } from '@/plugins/useFlash';
import Code from '@/components/elements/Code';
import { useTranslation } from 'react-i18next';

export default () => {
    const { t } = useTranslation();
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
        <PageContentBlock title={t('dashboard.account_api.header', 'Account API')}>
            <FlashMessageRender byKey={'account'} />
            <div css={tw`md:flex flex-nowrap my-10`}>
                <ContentBox title={t('dashboard.account_api.create_key', 'Create API Key')} css={tw`flex-none w-full md:w-1/2`}>
                    <CreateApiKeyForm onKeyCreated={(key) => setKeys((s) => [...s!, key])} />
                </ContentBox>
                <ContentBox title={t('dashboard.account_api.api_keys', 'API Keys')} css={tw`flex-1 overflow-hidden mt-8 md:mt-0 md:ml-8`}>
                    <SpinnerOverlay visible={loading} />
                    <Dialog.Confirm
                        title={t('dashboard.account_api.delete_key', 'Delete API Key')}
                        confirm={t('dashboard.account_api.delete_key_button', 'Delete Key')}
                        open={!!deleteIdentifier}
                        onClose={() => setDeleteIdentifier('')}
                        onConfirmed={() => doDeletion(deleteIdentifier)}
                    >
                        {t('dashboard.account_api.delete_key_prefix', 'All requests using the')} <Code>{deleteIdentifier}</Code> {t('dashboard.account_api.delete_key_suffix', 'key will be invalidated.')}
                    </Dialog.Confirm>
                    {keys.length === 0 ? (
                        <p css={tw`text-center text-sm`}>
                            {loading ? t('global.loading', 'Loading...') : t('dashboard.account_api.no_keys', 'No API keys exist for this account.')}
                        </p>
                    ) : (
                        keys.map((key, index) => (
                            <GreyRowBox
                                key={key.identifier}
                                css={[tw`flex items-center`, index > 0 && tw`mt-2`]}
                            >
                                <div className="icon">
                                    <FontAwesomeIcon icon={faKey} />
                                </div>
                                <div css={tw`ml-4 flex-1 overflow-hidden`}>
                                    <p css={tw`text-sm break-words text-neutral-100 font-medium`}>{key.description}</p>
                                    <p css={tw`text-xs mt-1 uppercase text-neutral-500`}>
                                        {t('dashboard.account_api.last_used', 'Last used:')}&nbsp;
                                        {key.lastUsedAt ? format(key.lastUsedAt, 'MMM do, yyyy HH:mm') : t('dashboard.account_api.never', 'Never')}
                                    </p>
                                </div>
                                <p css={tw`text-sm ml-4 hidden md:block`}>
                                    <code css={tw`font-mono py-1 px-2 rounded`} style={{ backgroundColor: 'rgb(var(--bg-card-hover))', color: 'rgb(var(--text-secondary))' }}>{key.identifier}</code>
                                </p>
                                <button css={tw`ml-4 p-2 text-sm`} onClick={() => setDeleteIdentifier(key.identifier)}>
                                    <FontAwesomeIcon
                                        icon={faTrashAlt}
                                        css={tw`transition-colors duration-150 text-red-400 hover:text-red-500`}
                                    />
                                </button>
                            </GreyRowBox>
                        ))
                    )}
                </ContentBox>
            </div>
        </PageContentBlock>
    );
};
