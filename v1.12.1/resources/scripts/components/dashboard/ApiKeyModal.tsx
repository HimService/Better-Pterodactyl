import React, { useContext } from 'react';
import tw from 'twin.macro';
import Button from '@/components/elements/Button';
import asModal, { AsModalProps } from '@/hoc/asModal';
import ModalContext from '@/context/ModalContext';
import CopyOnClick from '@/components/elements/CopyOnClick';

import { useTranslation } from 'react-i18next';

interface Props {
    apiKey: string;
}

const ApiKeyModal = ({ apiKey }: Props) => {
    const { dismiss } = useContext(ModalContext);
    const { t } = useTranslation();

    return (
        <>
            <h3 css={tw`mb-4 text-2xl font-semibold text-neutral-50`}>{t('dashboard.account_api.api_key_modal.title')}</h3>
            <p css={tw`text-sm mb-6 text-neutral-400`}>
                {t('dashboard.account_api.api_key_modal.description')}
            </p>
            <pre css={tw`text-sm bg-black/60 border border-white/10 rounded-xl py-4 px-6 font-mono text-neutral-200 shadow-inner`}>
                <CopyOnClick text={apiKey}>
                    <code css={tw`font-mono break-all`}>{apiKey}</code>
                </CopyOnClick>
            </pre>
            <div css={tw`flex justify-end mt-8`}>
                <Button type={'button'} onClick={() => dismiss()}>
                    {t('global.close')}
                </Button>
            </div>
        </>
    );
};

ApiKeyModal.displayName = 'ApiKeyModal';

const modalOptions = { closeOnEscape: false, closeOnBackground: false };
const LazyApiKeyModal = (props: Props & AsModalProps) => {
    const ModalRef = React.useRef<React.ComponentType<Props & AsModalProps> | null>(null);
    if (!ModalRef.current) {
        ModalRef.current = asModal<Props>(modalOptions)(ApiKeyModal);
    }
    const WrappedModal = ModalRef.current;
    return <WrappedModal {...props} />;
};

export default LazyApiKeyModal;
