import React, { useEffect, useState } from 'react';
import tw from 'twin.macro';
import { Button } from '@/components/elements/button/index';
import Fade from '@/components/elements/Fade';
import SpinnerOverlay from '@/components/elements/SpinnerOverlay';
import useFileManagerSwr from '@/plugins/useFileManagerSwr';
import useFlash from '@/plugins/useFlash';
import compressFiles from '@/api/server/files/compressFiles';
import { ServerContext } from '@/state/server';
import deleteFiles from '@/api/server/files/deleteFiles';
import RenameFileModal from '@/components/server/files/RenameFileModal';
import Portal from '@/components/elements/Portal';
import { Dialog } from '@/components/elements/dialog';
import { useTranslation } from 'react-i18next';
import restoreFiles from '@/api/server/files/restoreFiles';

const MassActionsBar = () => {
    const { t } = useTranslation();
    const uuid = ServerContext.useStoreState((state) => state.server.data!.uuid);

    const { mutate } = useFileManagerSwr();
    const { clearFlashes, clearAndAddHttpError } = useFlash();
    const [loading, setLoading] = useState(false);
    const [loadingMessage, setLoadingMessage] = useState('');
    const [showConfirm, setShowConfirm] = useState(false);
    const [showMove, setShowMove] = useState(false);
    const directory = ServerContext.useStoreState((state) => state.files.directory);

    const selectedFiles = ServerContext.useStoreState((state) => state.files.selectedFiles);
    const setSelectedFiles = ServerContext.useStoreActions((actions) => actions.files.setSelectedFiles);

    useEffect(() => {
        if (!loading) setLoadingMessage('');
    }, [loading]);

    const onClickCompress = () => {
        setLoading(true);
        clearFlashes('files');
        setLoadingMessage(t('server.files.archiving', 'Archiving files...'));

        compressFiles(uuid, directory, selectedFiles)
            .then(() => mutate())
            .then(() => setSelectedFiles([]))
            .catch((error) => clearAndAddHttpError({ key: 'files', error }))
            .then(() => setLoading(false));
    };

    const onClickRestore = () => {
        setLoading(true);
        clearFlashes('files');
        setLoadingMessage(t('server.files.restoring', 'Restoring files...'));

        restoreFiles(uuid, selectedFiles)
            .then(() => {
                mutate();
                setSelectedFiles([]);
            })
            .catch((error) => clearAndAddHttpError({ key: 'files', error }))
            .then(() => setLoading(false));
    };

    const onClickConfirmDeletion = () => {
        setLoading(true);
        setShowConfirm(false);
        clearFlashes('files');
        setLoadingMessage(t('server.files.deleting', 'Deleting files...'));

        deleteFiles(uuid, directory, selectedFiles)
            .then(() => {
                mutate((files) => files.filter((f) => selectedFiles.indexOf(f.name) < 0), false);
                setSelectedFiles([]);
            })
            .catch((error) => {
                mutate();
                clearAndAddHttpError({ key: 'files', error });
            })
            .then(() => setLoading(false));
    };

    return (
        <>
            <div css={tw`pointer-events-none fixed bottom-0 z-20 left-0 right-0 flex justify-center`}>
                <SpinnerOverlay visible={loading} size={'large'} fixed>
                    {loadingMessage}
                </SpinnerOverlay>
                <Dialog.Confirm
                    title={t('server.files.delete_title', 'Delete Files')}
                    open={showConfirm}
                    confirm={t('global.delete', 'Delete')}
                    onClose={() => setShowConfirm(false)}
                    onConfirmed={onClickConfirmDeletion}
                >
                    <p className={'mb-2'}>
                        {t('server.files.delete_mass_confirm_prefix', 'Are you sure you want to delete')}&nbsp;
                        <span className={'font-semibold text-neutral-900 dark:text-gray-50'}>{selectedFiles.length} {t('server.files.files_count', 'files')}</span>? {t('server.files.delete_mass_confirm_suffix', 'This is a permanent action and the files cannot be recovered.')}
                    </p>
                    {selectedFiles.slice(0, 15).map((file) => (
                        <li key={file}>{file}</li>
                    ))}
                    {selectedFiles.length > 15 && <li>{t('server.files.and_more', 'and')} {selectedFiles.length - 15} {t('server.files.others', 'others')}</li>}
                </Dialog.Confirm>
                {showMove && (
                    <RenameFileModal
                        files={selectedFiles}
                        visible
                        appear
                        useMoveTerminology
                        onDismissed={() => setShowMove(false)}
                    />
                )}
                <Portal>
                    <div className={'pointer-events-none fixed bottom-0 mb-6 flex justify-center w-full z-50'}>
                        <Fade timeout={75} in={selectedFiles.length > 0} unmountOnExit>
                            <div css={tw`flex items-center space-x-4 pointer-events-auto rounded p-4 bg-black/50`}>
                                {directory === '.bp_trash' || directory === '/.bp_trash' ? (
                                    <>
                                        <Button onClick={onClickRestore}>{t('server.files.restore', 'Restore')}</Button>
                                        <Button.Danger
                                            variant={Button.Variants.Secondary}
                                            onClick={() => setShowConfirm(true)}
                                        >
                                            {t('global.delete', 'Delete')}
                                        </Button.Danger>
                                    </>
                                ) : (
                                    <>
                                        <Button onClick={() => setShowMove(true)}>{t('server.files.move', 'Move')}</Button>
                                        <Button onClick={onClickCompress}>{t('server.files.archive', 'Archive')}</Button>
                                        <Button.Danger variant={Button.Variants.Secondary} onClick={() => setShowConfirm(true)}>
                                            {t('global.delete', 'Delete')}
                                        </Button.Danger>
                                    </>
                                )}
                            </div>
                        </Fade>
                    </div>
                </Portal>
            </div>
        </>
    );
};

export default MassActionsBar;
