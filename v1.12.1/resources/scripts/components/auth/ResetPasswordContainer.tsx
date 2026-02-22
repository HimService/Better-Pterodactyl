import React, { useState } from 'react';
import { RouteComponentProps } from 'react-router';
import { Link } from 'react-router-dom';
import performPasswordReset from '@/api/auth/performPasswordReset';
import { httpErrorToHuman } from '@/api/http';
import LoginFormContainer from '@/components/auth/LoginFormContainer';
import { Actions, useStoreActions } from 'easy-peasy';
import { ApplicationStore } from '@/state';
import { Formik, FormikHelpers } from 'formik';
import { object, ref, string } from 'yup';
import Field from '@/components/elements/Field';
import Input from '@/components/elements/Input';
import tw from 'twin.macro';
import Button from '@/components/elements/Button';
import { useTranslation } from 'react-i18next';

interface Values {
    password: string;
    passwordConfirmation: string;
}

export default function ResetPasswordContainer({ match, location }: RouteComponentProps<{ token: string }>) {
    const { t } = useTranslation();
    const [email, setEmail] = useState('');

    const { clearFlashes, addFlash } = useStoreActions((actions: Actions<ApplicationStore>) => actions.flashes);

    const parsed = new URLSearchParams(location.search);
    if (email.length === 0 && parsed.get('email')) {
        setEmail(parsed.get('email') || '');
    }

    const submit = ({ password, passwordConfirmation }: Values, { setSubmitting }: FormikHelpers<Values>) => {
        clearFlashes();
        performPasswordReset(email, { token: match.params.token, password, passwordConfirmation })
            .then(() => {
                // @ts-expect-error this is valid
                window.location = '/';
            })
            .catch((error) => {
                console.error(error);

                setSubmitting(false);
                addFlash({ type: 'error', title: t('global.error'), message: httpErrorToHuman(error) });
            });
    };

    return (
        <Formik
            onSubmit={submit}
            initialValues={{
                password: '',
                passwordConfirmation: '',
            }}
            validationSchema={object().shape({
                password: string()
                    .required(t('auth.reset_password.password_required', 'A new password is required.'))
                    .min(8, t('auth.reset_password.password_min_length', 'Your new password should be at least 8 characters in length.')),
                passwordConfirmation: string()
                    .required(t('auth.reset_password.password_confirm_required', 'Your new password does not match.'))
                    // @ts-expect-error this is valid
                    .oneOf([ref('password'), null], t('auth.reset_password.password_mismatch', 'Your new password does not match.')),
            })}
        >
            {({ isSubmitting }) => (
                <LoginFormContainer title={t('auth.reset_password.title', 'Reset Password')} css={tw`w-full flex`}>
                    <div>
                        <label>{t('auth.reset_password.email', 'Email')}</label>
                        <Input value={email} isLight disabled />
                    </div>
                    <div css={tw`mt-6`}>
                        <Field
                            light
                            label={t('auth.reset_password.new_password', 'New Password')}
                            name={'password'}
                            type={'password'}
                            description={t('auth.reset_password.password_description', 'Passwords must be at least 8 characters in length.')}
                        />
                    </div>
                    <div css={tw`mt-6`}>
                        <Field label={t('auth.reset_password.confirm_password', 'Confirm New Password')} name={'passwordConfirmation'} type={'password'} />
                    </div>
                    <div css={tw`mt-6`}>
                        <Button size={'xlarge'} type={'submit'} disabled={isSubmitting} isLoading={isSubmitting}>
                            {t('auth.reset_password.reset_button', 'Reset Password')}
                        </Button>
                    </div>
                    <div css={tw`mt-6 text-center`}>
                        <Link
                            to={'/auth/login'}
                            css={tw`text-xs text-neutral-500 tracking-wide no-underline uppercase hover:text-neutral-600`}
                        >
                            {t('auth.reset_password.return_login', 'Return to Login')}
                        </Link>
                    </div>
                </LoginFormContainer>
            )}
        </Formik >
    );
};
