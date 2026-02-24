import React, { forwardRef } from 'react';
import { Form } from 'formik';
import styled from 'styled-components/macro';
import { breakpoint } from '@/theme';
import FlashMessageRender from '@/components/FlashMessageRender';
import tw from 'twin.macro';
import { useTranslation } from 'react-i18next';

type Props = React.DetailedHTMLProps<React.FormHTMLAttributes<HTMLFormElement>, HTMLFormElement> & {
    title?: string;
};

const Container = styled.div`
    ${breakpoint('sm')`
        ${tw`w-full`}
    `};

    ${breakpoint('xl')`
        ${tw`w-full`}
    `};
`;

export default forwardRef<HTMLFormElement, Props>(({ title, ...props }, ref) => {
    const { t } = useTranslation();

    return (
        <Container>
            {title && (
                <div className="mb-8">
                    <h2 className="text-3xl md:text-4xl font-black tracking-tight text-neutral-900 dark:text-white mb-2">
                        {title}
                    </h2>
                    <p className="text-neutral-500 dark:text-neutral-400 text-sm font-medium">
                        {t('auth.login.please_enter_credentials', 'Please enter your credentials to access the panel.')}
                    </p>
                </div>
            )}

            <FlashMessageRender css={tw`mb-6 px-1`} />

            <Form {...props} ref={ref}>
                <div className="w-full transition-all duration-500 relative">
                    <div className="flex-1 relative z-10">{props.children}</div>
                </div>
            </Form>

            <p className="text-center text-xs mt-12 transition-colors text-neutral-400 dark:text-neutral-500 font-medium">
                <a
                    href={'https://github.com/HimService/Better-Pterodactyl'}
                    target={'_blank'}
                    rel={'noopener nofollow noreferrer'}
                    className="font-bold tracking-widest mr-2 no-underline text-neutral-400 dark:text-neutral-500 hover:text-brand-500 dark:hover:text-brand-400 transition-colors"
                >
                    Better Pterodactyl
                </a>
                <span className="opacity-50">|</span>
                &nbsp;&copy; 2015 - {new Date().getFullYear()}&nbsp;
                <a
                    rel={'noopener nofollow noreferrer'}
                    href={'https://pterodactyl.io'}
                    target={'_blank'}
                    className="no-underline transition-colors hover:text-brand-500 dark:hover:text-brand-400"
                >
                    {t('auth.login.pterodactyl_software', 'Pterodactyl Software')}
                </a>
            </p>
        </Container>
    );
});
