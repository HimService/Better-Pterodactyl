import React, { useContext, useEffect, useState } from 'react';
import asDialog from '@/hoc/asDialog';
import { Dialog, DialogWrapperContext } from '@/components/elements/dialog';
import { Button } from '@/components/elements/button/index';
import { Input } from '@/components/elements/inputs';
import Tooltip from '@/components/elements/tooltip/Tooltip';
import disableAccountTwoFactor from '@/api/account/disableAccountTwoFactor';
import { useFlashKey } from '@/plugins/useFlash';
import { useStoreActions } from '@/state/hooks';
import FlashMessageRender from '@/components/FlashMessageRender';
import { useTranslation, Trans } from 'react-i18next';

const DisableTOTPDialog = () => {
    const { t } = useTranslation();
    const [submitting, setSubmitting] = useState(false);
    const [password, setPassword] = useState('');
    const { clearAndAddHttpError } = useFlashKey('account:two-step');
    const { close, setProps } = useContext(DialogWrapperContext);
    const updateUserData = useStoreActions((actions) => actions.user.updateUserData);

    useEffect(() => {
        setProps((state) => ({
            ...state,
            title: t('dashboard.account_overview.disable_2fa'),
            description: t('dashboard.account_overview.disable_2fa_description'),
        }));
    }, []);

    useEffect(() => {
        setProps((state) => ({ ...state, preventExternalClose: submitting }));
    }, [submitting]);

    const submit = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        e.stopPropagation();

        if (submitting) return;

        setSubmitting(true);
        clearAndAddHttpError();
        disableAccountTwoFactor(password)
            .then(() => {
                updateUserData({ useTotp: false });
                close();
            })
            .catch(clearAndAddHttpError)
            .then(() => setSubmitting(false));
    };

    return (
        <form id={'disable-totp-form'} className={'mt-6'} onSubmit={submit}>
            <FlashMessageRender byKey={'account:two-step'} className={'-mt-2 mb-6'} />
            <label className={'block pb-1'} htmlFor={'totp-password'}>
                {t('dashboard.account_overview.password', 'Password')}
            </label>
            <Input.Text
                id={'totp-password'}
                type={'password'}
                variant={Input.Text.Variants.Loose}
                value={password}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setPassword(e.currentTarget.value)}
            />
            <Dialog.Footer>
                <Button.Text onClick={close}>{t('global.cancel', 'Cancel')}</Button.Text>
                <Tooltip
                    delay={100}
                    disabled={password.length > 0}
                    content={t('dashboard.account_overview.must_enter_password', 'You must enter your account password to continue.')}
                >
                    <Button.Danger type={'submit'} form={'disable-totp-form'} disabled={submitting || !password.length}>
                        {t('global.disable', 'Disable')}
                    </Button.Danger>
                </Tooltip>
            </Dialog.Footer>
        </form>
    );
};

export default asDialog({})(DisableTOTPDialog);
