import React, { useEffect } from 'react';
import { httpErrorToHuman } from '@/api/http';
import { CSSTransition } from 'react-transition-group';
import Spinner from '@/components/elements/Spinner';
import FileObjectRow from '@/components/server/files/FileObjectRow';
import { useLocation } from 'react-router-dom';
import { ServerError } from '@/components/elements/ScreenBlock';
import tw from 'twin.macro';
import { Button } from '@/components/elements/button/index';
import { ServerContext } from '@/state/server';
import loadDirectory, { FileObject } from '@/api/server/files/loadDirectory';
import { cleanDirectoryPath } from '@/helpers';
import useTrashManagerSwr from '@/plugins/useTrashManagerSwr';
import MassActionsBar from '@/components/server/files/MassActionsBar';
import ServerContentBlock from '@/components/elements/ServerContentBlock';
import { useStoreActions } from '@/state/hooks';
import ErrorBoundary from '@/components/elements/ErrorBoundary';
import { FileActionCheckbox } from '@/components/server/files/SelectFileCheckbox';
import { useTranslation } from 'react-i18next';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTrashAlt, faExclamationTriangle } from '@fortawesome/free-solid-svg-icons';
import deleteFiles from '@/api/server/files/deleteFiles';

const sortFiles = (files: FileObject[]): FileObject[] => {
    return files
        .sort((a, b) => a.name.localeCompare(b.name))
        .sort((a, b) => (a.isFile === b.isFile ? 0 : a.isFile ? 1 : -1));
};

export default () => {
    const { t } = useTranslation();
    const uuid = ServerContext.useStoreState((state) => state.server.data!.uuid);

    // Hardcoded to .bp_trash
    const directory = '.bp_trash';

    const { data: files, error, mutate } = useTrashManagerSwr();

    const clearFlashes = useStoreActions((actions) => actions.flashes.clearFlashes);
    const setDirectory = ServerContext.useStoreActions((actions) => actions.files.setDirectory);
    const setSelectedFiles = ServerContext.useStoreActions((actions) => actions.files.setSelectedFiles);
    const selectedFilesLength = ServerContext.useStoreState((state) => state.files.selectedFiles.length);

    const { addFlash, clearAndAddHttpError } = useStoreActions((actions) => actions.flashes);

    useEffect(() => {
        clearFlashes('files');
        setSelectedFiles([]);
        setDirectory(directory);
    }, []);

    const onSelectAllClick = (e: React.ChangeEvent<HTMLInputElement>) => {
        setSelectedFiles(e.currentTarget.checked ? files?.map((file) => file.name) || [] : []);
    };

    const onEmptyTrashClick = () => {
        if (!files || files.length === 0) return;
        if (!confirm(t('server.trash.confirm_empty', 'Are you sure you want to empty the trash? This action cannot be undone.'))) return;

        const fileNames = files.map(f => f.name);
        deleteFiles(uuid, '.bp_trash', fileNames)
            .then(() => {
                mutate();
                addFlash({ key: 'files', type: 'success', message: t('server.trash.empty_success', 'Trash emptied successfully.') });
            })
            .catch(error => clearAndAddHttpError({ key: 'files', error }));
    };

    if (error) {
        return <ServerError message={httpErrorToHuman(error)} onRetry={() => mutate()} />;
    }

    return (
        <ServerContentBlock title={t('server.trash.header', 'Trash Can')} showFlashKey={'files'}>
            <div css={tw`bg-yellow-500 bg-opacity-10 border border-yellow-500 rounded-lg p-4 mb-4 flex items-center text-yellow-500`}>
                <FontAwesomeIcon icon={faExclamationTriangle} css={tw`mr-3`} />
                <p css={tw`text-sm font-medium`}>
                    {t('server.trash.quota_warning', 'Files in the trash still count towards your server\'s disk quota.')}
                </p>
            </div>

            <ErrorBoundary>
                <div className={'flex items-center justify-between mb-4'}>
                    <div className={'flex items-center'}>
                        <FileActionCheckbox
                            type={'checkbox'}
                            css={tw`mx-4`}
                            checked={selectedFilesLength === (files?.length === 0 ? -1 : files?.length)}
                            onChange={onSelectAllClick}
                        />
                        <h2 css={tw`text-lg font-header font-medium`}>{t('server.trash.files_count', '{{count}} items in trash', { count: files?.length || 0 })}</h2>
                    </div>
                    <Button color={'red'} isSecondary onClick={onEmptyTrashClick} disabled={!files?.length}>
                        <FontAwesomeIcon icon={faTrashAlt} css={tw`mr-2`} />
                        {t('server.trash.empty_button', 'Empty Trash')}
                    </Button>
                </div>
            </ErrorBoundary>

            {!files ? (
                <Spinner size={'large'} centered />
            ) : (
                <>
                    {!files.length ? (
                        <p css={tw`text-sm text-neutral-400 text-center py-12`}>
                            {t('server.trash.empty_trash_message', 'The trash is currently empty.')}
                        </p>
                    ) : (
                        <CSSTransition classNames={'fade'} timeout={150} appear in>
                            <div>
                                <div className={'rounded-lg shadow-sm border border-[rgb(var(--border-color))] overflow-hidden'}>
                                    {sortFiles(files).map((file) => (
                                        <FileObjectRow key={file.key} file={file} />
                                    ))}
                                </div>
                                <MassActionsBar />
                            </div>
                        </CSSTransition>
                    )}
                </>
            )}
        </ServerContentBlock>
    );
};
