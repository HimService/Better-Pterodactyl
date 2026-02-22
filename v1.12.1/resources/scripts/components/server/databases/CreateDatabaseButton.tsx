import React, { useState } from 'react';
import Modal from '@/components/elements/Modal';
import { Form, Formik, FormikHelpers } from 'formik';
import { useTranslation } from 'react-i18next';
import Field from '@/components/elements/Field';
import { object, string } from 'yup';
import createServerDatabase from '@/api/server/databases/createServerDatabase';
import { ServerContext } from '@/state/server';
import { httpErrorToHuman } from '@/api/http';
import FlashMessageRender from '@/components/FlashMessageRender';
import useFlash from '@/plugins/useFlash';
import Button from '@/components/elements/Button';
import tw from 'twin.macro';

interface Values {
    databaseName: string;
    connectionsFrom: string;
}

export default ({ css }: { css?: React.CSSProperties }) => {
    const { t } = useTranslation();

    const schema = object().shape({
        databaseName: string()
            .required(t('server.databases.validation.name.required', '必須提供資料庫名稱。'))
            .min(3, t('server.databases.validation.name.min', '資料庫名稱至少需要 3 個字元。'))
            .max(48, t('server.databases.validation.name.max', '資料庫名稱不得超過 48 個字元。'))
            .matches(
                /^[\w\-.]{3,48}$/,
                t('server.databases.validation.name.regex', '資料庫名稱只能包含英數字元、底線、破折號和 / 或句點。')
            ),
        connectionsFrom: string().matches(/^[\w\-/.%:]+$/, t('server.databases.validation.connections.regex', '必須提供有效的主機位址。')),
    });

    const uuid = ServerContext.useStoreState((state) => state.server.data!.uuid);
    const { addError, clearFlashes } = useFlash();
    const [visible, setVisible] = useState(false);

    const appendDatabase = ServerContext.useStoreActions((actions) => actions.databases.appendDatabase);

    const submit = (values: Values, { setSubmitting }: FormikHelpers<Values>) => {
        clearFlashes('database:create');
        createServerDatabase(uuid, {
            databaseName: values.databaseName,
            connectionsFrom: values.connectionsFrom || '%',
        })
            .then((database) => {
                appendDatabase(database);
                setVisible(false);
            })
            .catch((error) => {
                addError({ key: 'database:create', message: httpErrorToHuman(error) });
                setSubmitting(false);
            });
    };

    return (
        <>
            <Formik
                onSubmit={submit}
                initialValues={{ databaseName: '', connectionsFrom: '%' }}
                validationSchema={schema}
            >
                {({ isSubmitting, resetForm }) => (
                    <Modal
                        visible={visible}
                        dismissable={!isSubmitting}
                        showSpinnerOverlay={isSubmitting}
                        onDismissed={() => {
                            resetForm();
                            setVisible(false);
                        }}
                    >
                        <FlashMessageRender byKey={'database:create'} css={tw`mb-6`} />
                        <h2 css={tw`text-2xl mb-6 text-neutral-100`}>{t('server.databases.create_new', 'Create new database')}</h2>
                        <Form css={tw`m-0`}>
                            <div css={tw`flex flex-wrap`}>
                                <div css={tw`w-full sm:w-1/2 sm:pr-2`}>
                                    <Field
                                        name={'databaseName'}
                                        label={t('server.databases.name_label', 'Database Name')}
                                        description={t('server.databases.name_description', 'A descriptive name for your database instance.')}
                                    />
                                </div>
                                <div css={tw`w-full sm:w-1/2 sm:pl-2 mt-6 sm:mt-0`}>
                                    <Field
                                        name={'connectionsFrom'}
                                        label={t('server.databases.connections_label', 'Connections From')}
                                        description={t('server.databases.connections_description', 'Where connections should be allowed from. Leave blank to allow connections from anywhere.')}
                                    />
                                </div>
                            </div>
                            <div css={tw`flex flex-wrap justify-end mt-6`}>
                                <Button
                                    type={'button'}
                                    isSecondary
                                    css={tw`w-full sm:w-auto sm:mr-2`}
                                    onClick={() => setVisible(false)}
                                >
                                    {t('global.cancel', 'Cancel')}
                                </Button>
                                <Button css={tw`w-full mt-4 sm:w-auto sm:mt-0`} type={'submit'} isLoading={isSubmitting}>
                                    {t('server.databases.create_button', 'Create Database')}
                                </Button>
                            </div>
                        </Form>
                    </Modal>
                )}
            </Formik>
            <Button onClick={() => setVisible(true)}>{t('server.databases.new_database', 'New Database')}</Button>
        </>
    );
};
