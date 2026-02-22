import React, { useContext } from 'react';
import tw from 'twin.macro';
import Button from '@/components/elements/Button';
import asModal, { AsModalProps } from '@/hoc/asModal';
import ModalContext from '@/context/ModalContext';
import { useTranslation } from 'react-i18next';

type Props = {
    title: string;
    buttonText: string;
    onConfirmed: () => void;
    showSpinnerOverlay?: boolean;
};

const ConfirmationModal: React.FC<Props> = ({ title, children, buttonText, onConfirmed }) => {
    const { dismiss } = useContext(ModalContext);
    const { t } = useTranslation();

    return (
        <>
            <h2 css={tw`text-2xl mb-6`}>{title}</h2>
            <div css={tw`text-neutral-300`}>{children}</div>
            <div css={tw`flex flex-wrap items-center justify-end mt-8`}>
                <Button isSecondary onClick={() => dismiss()} css={tw`w-full sm:w-auto border-transparent`}>
                    {t('global.cancel', 'Cancel')}
                </Button>
                <Button color={'red'} css={tw`w-full sm:w-auto mt-4 sm:mt-0 sm:ml-4`} onClick={() => onConfirmed()}>
                    {buttonText}
                </Button>
            </div>
        </>
    );
};

ConfirmationModal.displayName = 'ConfirmationModal';

type ConfirmationModalProps = Props & import('@/hoc/asModal').AsModalProps;
const LazyConfirmationModal = (props: ConfirmationModalProps) => {
    const ModalRef = React.useRef<React.ComponentType<ConfirmationModalProps> | null>(null);
    if (!ModalRef.current) {
        ModalRef.current = asModal<Props>((p) => ({ showSpinnerOverlay: p.showSpinnerOverlay }))(ConfirmationModal);
    }
    const WrappedModal = ModalRef.current;
    return <WrappedModal {...props} />;
};

export default LazyConfirmationModal;

