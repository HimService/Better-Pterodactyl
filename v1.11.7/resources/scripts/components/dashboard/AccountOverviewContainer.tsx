import * as React from 'react';
import TitledGreyBox from '@/components/elements/TitledGreyBox';
import UpdatePasswordForm from '@/components/dashboard/forms/UpdatePasswordForm';
import UpdateEmailAddressForm from '@/components/dashboard/forms/UpdateEmailAddressForm';
import ConfigureTwoFactorForm from '@/components/dashboard/forms/ConfigureTwoFactorForm';
import PageContentBlock from '@/components/elements/PageContentBlock';
import tw from 'twin.macro';
import { breakpoint } from '@/theme';
import styled from 'styled-components/macro';
import MessageBox from '@/components/MessageBox';
import { useLocation } from 'react-router-dom';


export default () => {
    const { state } = useLocation<undefined | { twoFactorRedirect?: boolean }>();

    return (
        <PageContentBlock title={'帳戶總覽'}>
            {state?.twoFactorRedirect && (
                <MessageBox title={'需要兩步驟驗證'} type={'error'}>
                    您的帳戶必須啟用兩步驟驗證才能繼續。
                </MessageBox>
            )}

            <div css={[tw`lg:grid lg:grid-cols-3 gap-8 mb-10`, state?.twoFactorRedirect ? tw`mt-4` : tw`mt-10`]}>
                <TitledGreyBox title={'更新密碼'}>
                    <UpdatePasswordForm />
                </TitledGreyBox>
                <TitledGreyBox title={'更新電子郵件地址'}>
                    <UpdateEmailAddressForm />
                </TitledGreyBox>
                <TitledGreyBox title={'兩步驟驗證'}>
                    <ConfigureTwoFactorForm />
                </TitledGreyBox>
            </div>
        </PageContentBlock>
    );
};
