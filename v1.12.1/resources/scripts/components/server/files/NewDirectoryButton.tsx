import React, { useContext, useEffect, useState } from 'react';
import { ServerContext } from '@/state/server';
import { Form, Formik, FormikHelpers } from 'formik';
import Field from '@/components/elements/Field';
import { join } from 'pathe';
import { object, string } from 'yup';
import createDirectory from '@/api/server/files/createDirectory';
import tw from 'twin.macro';
import { Button } from '@/components/elements/button/index';
import { FileObject } from '@/api/server/files/loadDirectory';
import { useFlashKey } from '@/plugins/useFlash';
import useFileManagerSwr from '@/plugins/useFileManagerSwr';
import { WithClassname } from '@/components/types';
import FlashMessageRender from '@/components/FlashMessageRender';
import { Dialog, DialogWrapperContext } from '@/components/elements/dialog';
import Code from '@/components/elements/Code';
import asDialog from '@/hoc/asDialog';
import { useTranslation } from 'react-i18next';

interface Values {
    directoryName: string;
}

const generateDirectoryData = (name: string): FileObject => ({
    key: `dir_${name.split('/', 1)[0] ?? name}`,
    name: name.replace(/^(\/*)/, '').split('/', 1)[0] ?? name,
    mode: 'drwxr-xr-x',
    modeBits: '0755',
    size: 0,
    isFile: false,
    isSymlink: false,
    mimetype: '',
    createdAt: new Date(),
    modifiedAt: new Date(),
    isArchiveType: () => false,
    isEditable: () => false,
});

const NewDirectoryDialog = asDialog({
    title: 'server.files.create_directory',
})(() => {
    const { t } = useTranslation();
    const uuid = ServerContext.useStoreState((state) => state.server.data!.uuid);
    const directory = ServerContext.useStoreState((state) => state.files.directory);

    const { mutate } = useFileManagerSwr();
    const { close } = useContext(DialogWrapperContext);
    const { clearAndAddHttpError } = useFlashKey('files:directory-modal');

    useEffect(() => {
        return () => {
            clearAndAddHttpError();
        };
    }, []);

    const submit = ({ directoryName }: Values, { setSubmitting }: FormikHelpers<Values>) => {
        createDirectory(uuid, directory, directoryName)
            .then(() => mutate((data) => [...data, generateDirectoryData(directoryName)], false))
            .then(() => close())
            .catch((error) => {
                setSubmitting(false);
                clearAndAddHttpError(error);
            });
    };

    return (
        <Formik
            onSubmit={submit}
            validationSchema={object().shape({
                directoryName: string().required(t('server.files.valid_directory_name')),
            })}
            initialValues={{ directoryName: '' }}
        >
            {({ submitForm, values }) => (
                <>
                    <FlashMessageRender key={'files:directory-modal'} />
                    <Form css={tw`m-0`}>
                        <Field
                            autoFocus
                            id={'directoryName'}
                            name={'directoryName'}
                            label={t('server.files.directory_name')}
                        />
                        <p css={tw`mt-2 text-sm md:text-base break-all`}>
                            <span css={tw`text-neutral-200 uppercase text-[10px] font-bold tracking-wider mr-1`}>
                                {t('server.files.create_directory_help')}
                            </span>
                            <Code>
                                /home/container/
                                <span css={tw`text-cyan-200`}>
                                    {join(directory, values.directoryName).replace(/^(\.\.\/|\/)+/, '')}
                                </span>
                            </Code>
                        </p>
                    </Form>
                    <Dialog.Footer>
                        <Button.Text className={'w-full sm:w-auto'} onClick={close}>
                            {t('global.cancel')}
                        </Button.Text>
                        <Button className={'w-full sm:w-auto'} onClick={submitForm}>
                            {t('global.create')}
                        </Button>
                    </Dialog.Footer>
                </>
            )}
        </Formik>
    );
});

export default ({ className }: WithClassname) => {
    const { t } = useTranslation();
    const [open, setOpen] = useState(false);

    return (
        <>
            <NewDirectoryDialog open={open} onClose={setOpen.bind(this, false)} />
            <Button.Text onClick={setOpen.bind(this, true)} className={className}>
                {t('server.files.create_directory')}
            </Button.Text>
        </>
    );
};
