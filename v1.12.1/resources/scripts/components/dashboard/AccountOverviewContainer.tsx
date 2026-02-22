import * as React from 'react';
import ContentBox from '@/components/elements/ContentBox';
import UpdatePasswordForm from '@/components/dashboard/forms/UpdatePasswordForm';
import UpdateEmailAddressForm from '@/components/dashboard/forms/UpdateEmailAddressForm';
import ConfigureTwoFactorForm from '@/components/dashboard/forms/ConfigureTwoFactorForm';
import PageContentBlock from '@/components/elements/PageContentBlock';
import tw from 'twin.macro';
import { breakpoint } from '@/theme';
import styled from 'styled-components/macro';
import MessageBox from '@/components/MessageBox';
import { useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

const Container = styled.div`
    ${tw`flex flex-wrap`};

    & > div {
        ${tw`w-full`};

        ${breakpoint('sm')`
      width: calc(50% - 1rem);
    `}

        ${breakpoint('md')`
      ${tw`w-auto flex-1`};
    `}
    }
`;

export default () => {
    const { t } = useTranslation();
    const { state } = useLocation<undefined | { twoFactorRedirect?: boolean }>();

    return (
        <PageContentBlock title={t('dashboard.account_overview.header', 'Account Overview')}>
            {state?.twoFactorRedirect && (
                <MessageBox title={t('dashboard.account_overview.2fa_required', '2-Factor Required')} type={'error'}>
                    {t('dashboard.account_overview.2fa_required_description', 'Your account must have two-factor authentication enabled in order to continue.')}
                </MessageBox>
            )}

            <Container css={[tw`lg:grid lg:grid-cols-3 mb-10`, state?.twoFactorRedirect ? tw`mt-4` : tw`mt-10`]}>
                <ContentBox title={t('dashboard.account_overview.update_password', 'Update Password')} showFlashes={'account:password'}>
                    <UpdatePasswordForm />
                </ContentBox>
                <ContentBox css={tw`mt-8 sm:mt-0 sm:ml-8`} title={t('dashboard.account_overview.update_email', 'Update Email Address')} showFlashes={'account:email'}>
                    <UpdateEmailAddressForm />
                </ContentBox>
                <ContentBox css={tw`md:ml-8 mt-8 md:mt-0`} title={t('dashboard.account_overview.two_step', 'Two-Step Verification')}>
                    <ConfigureTwoFactorForm />
                </ContentBox>
            </Container>
        </PageContentBlock>
    );
};
