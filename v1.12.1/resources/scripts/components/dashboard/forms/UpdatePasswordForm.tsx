import React from 'react';
import { Actions, State, useStoreActions, useStoreState } from 'easy-peasy';
import { Form, Formik, FormikHelpers } from 'formik';
import Field from '@/components/elements/Field';
import * as Yup from 'yup';
import SpinnerOverlay from '@/components/elements/SpinnerOverlay';
import updateAccountPassword from '@/api/account/updateAccountPassword';
import { httpErrorToHuman } from '@/api/http';
import { ApplicationStore } from '@/state';
import tw from 'twin.macro';
import { Button } from '@/components/elements/button/index';
import { useTranslation } from 'react-i18next';

interface Values {
    current: string;
    password: string;
    confirmPassword: string;
}

export default () => {
    const { t } = useTranslation();

    const schema = Yup.object().shape({
        current: Yup.string().min(1).required(t('dashboard.account_overview.must_provide_current_password', 'You must provide your current password.')),
        password: Yup.string().min(8).required(),
        confirmPassword: Yup.string().test(
            'password',
            t('dashboard.account_overview.password_confirmation_mismatch', 'Password confirmation does not match the password you entered.'),
            function (value) {
                return value === this.parent.password;
            }
        ),
    });

    const user = useStoreState((state: State<ApplicationStore>) => state.user.data);
    const { clearFlashes, addFlash } = useStoreActions((actions: Actions<ApplicationStore>) => actions.flashes);

    if (!user) {
        return null;
    }

    const submit = (values: Values, { setSubmitting }: FormikHelpers<Values>) => {
        clearFlashes('account:password');
        updateAccountPassword({ ...values })
            .then(() => {
                // @ts-expect-error this is valid
                window.location = '/auth/login';
            })
            .catch((error) =>
                addFlash({
                    key: 'account:password',
                    type: 'error',
                    title: t('global.error', 'Error'),
                    message: httpErrorToHuman(error),
                })
            )
            .then(() => setSubmitting(false));
    };

    return (
        <React.Fragment>
            <Formik
                onSubmit={submit}
                validationSchema={schema}
                initialValues={{ current: '', password: '', confirmPassword: '' }}
            >
                {({ isSubmitting, isValid }) => (
                    <React.Fragment>
                        <SpinnerOverlay size={'large'} visible={isSubmitting} />
                        <Form css={tw`m-0`}>
                            <Field
                                id={'current_password'}
                                type={'password'}
                                name={'current'}
                                label={t('dashboard.account_overview.current_password', 'Current Password')}
                            />
                            <div css={tw`mt-6`}>
                                <Field
                                    id={'new_password'}
                                    type={'password'}
                                    name={'password'}
                                    label={t('dashboard.account_overview.new_password', 'New Password')}
                                    description={
                                        t('dashboard.account_overview.new_password_help', 'Your new password should be at least 8 characters in length and unique to this website.')
                                    }
                                />
                            </div>
                            <div css={tw`mt-6`}>
                                <Field
                                    id={'confirm_new_password'}
                                    type={'password'}
                                    name={'confirmPassword'}
                                    label={t('dashboard.account_overview.confirm_new_password', 'Confirm New Password')}
                                />
                            </div>
                            <div css={tw`mt-6`}>
                                <Button disabled={isSubmitting || !isValid}>{t('dashboard.account_overview.update_password_button', 'Update Password')}</Button>
                            </div>
                        </Form>
                    </React.Fragment>
                )}
            </Formik>
        </React.Fragment>
    );
};
