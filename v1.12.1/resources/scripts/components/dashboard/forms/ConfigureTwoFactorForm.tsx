import React, { useEffect, useState } from 'react';
import { useStoreState } from 'easy-peasy';
import { ApplicationStore } from '@/state';
import tw from 'twin.macro';
import { Button } from '@/components/elements/button/index';
import SetupTOTPDialog from '@/components/dashboard/forms/SetupTOTPDialog';
import RecoveryTokensDialog from '@/components/dashboard/forms/RecoveryTokensDialog';
import DisableTOTPDialog from '@/components/dashboard/forms/DisableTOTPDialog';
import { useFlashKey } from '@/plugins/useFlash';
import { useTranslation } from 'react-i18next';

export default () => {
    const { t } = useTranslation();
    const [tokens, setTokens] = useState<string[]>([]);
    const [visible, setVisible] = useState<'enable' | 'disable' | null>(null);
    const isEnabled = useStoreState((state: ApplicationStore) => state.user.data!.useTotp);
    const { clearAndAddHttpError } = useFlashKey('account:two-step');

    useEffect(() => {
        return () => {
            clearAndAddHttpError();
        };
    }, [visible]);

    const onTokens = (tokens: string[]) => {
        setTokens(tokens);
        setVisible(null);
    };

    return (
        <div>
            <SetupTOTPDialog open={visible === 'enable'} onClose={() => setVisible(null)} onTokens={onTokens} />
            <RecoveryTokensDialog tokens={tokens} open={tokens.length > 0} onClose={() => setTokens([])} />
            <DisableTOTPDialog open={visible === 'disable'} onClose={() => setVisible(null)} />
            <p css={tw`text-sm`}>
                {isEnabled
                    ? t('dashboard.account_overview.2fa_enabled', 'Two-step verification is currently enabled on your account.')
                    : t('dashboard.account_overview.2fa_disabled', 'You do not currently have two-step verification enabled on your account. Click the button below to begin configuring it.')}
            </p>
            <div css={tw`mt-6`}>
                {isEnabled ? (
                    <Button.Danger onClick={() => setVisible('disable')}>{t('dashboard.account_overview.disable_2fa', 'Disable Two-Step')}</Button.Danger>
                ) : (
                    <Button onClick={() => setVisible('enable')}>{t('dashboard.account_overview.enable_2fa', 'Enable Two-Step')}</Button>
                )}
            </div>
        </div>
    );
};
