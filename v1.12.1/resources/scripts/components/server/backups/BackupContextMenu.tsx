import React, { useState } from 'react';
import {
    faBoxOpen,
    faCloudDownloadAlt,
    faEllipsisH,
    faLock,
    faTrashAlt,
    faUnlock,
} from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import DropdownMenu, { DropdownButtonRow } from '@/components/elements/DropdownMenu';
import getBackupDownloadUrl from '@/api/server/backups/getBackupDownloadUrl';
import useFlash from '@/plugins/useFlash';
import SpinnerOverlay from '@/components/elements/SpinnerOverlay';
import deleteBackup from '@/api/server/backups/deleteBackup';
import Can from '@/components/elements/Can';
import tw from 'twin.macro';
import getServerBackups from '@/api/swr/getServerBackups';
import { ServerBackup } from '@/api/server/types';
import { ServerContext } from '@/state/server';
import Input from '@/components/elements/Input';
import { restoreServerBackup } from '@/api/server/backups';
import http, { httpErrorToHuman } from '@/api/http';
import { Dialog } from '@/components/elements/dialog';
import { useTranslation } from 'react-i18next';

interface Props {
    backup: ServerBackup;
}

export default ({ backup }: Props) => {
    const { t } = useTranslation();
    const uuid = ServerContext.useStoreState((state) => state.server.data!.uuid);
    const setServerFromState = ServerContext.useStoreActions((actions) => actions.server.setServerFromState);
    const [modal, setModal] = useState('');
    const [loading, setLoading] = useState(false);
    const [truncate, setTruncate] = useState(false);
    const { clearFlashes, clearAndAddHttpError } = useFlash();
    const { mutate } = getServerBackups();

    const doDownload = () => {
        setLoading(true);
        clearFlashes('backups');
        getBackupDownloadUrl(uuid, backup.uuid)
            .then((url) => {
                // @ts-expect-error this is valid
                window.location = url;
            })
            .catch((error) => {
                console.error(error);
                clearAndAddHttpError({ key: 'backups', error });
            })
            .then(() => setLoading(false));
    };

    const doDeletion = () => {
        setLoading(true);
        clearFlashes('backups');
        deleteBackup(uuid, backup.uuid)
            .then(() =>
                mutate(
                    (data) => ({
                        ...data,
                        items: data.items.filter((b) => b.uuid !== backup.uuid),
                        backupCount: data.backupCount - 1,
                    }),
                    false
                )
            )
            .catch((error) => {
                console.error(error);
                clearAndAddHttpError({ key: 'backups', error });
                setLoading(false);
                setModal('');
            });
    };

    const doRestorationAction = () => {
        setLoading(true);
        clearFlashes('backups');
        restoreServerBackup(uuid, backup.uuid, truncate)
            .then(() =>
                setServerFromState((s) => ({
                    ...s,
                    status: 'restoring_backup',
                }))
            )
            .catch((error) => {
                console.error(error);
                clearAndAddHttpError({ key: 'backups', error });
            })
            .then(() => setLoading(false))
            .then(() => setModal(''));
    };

    const onLockToggle = () => {
        if (backup.isLocked && modal !== 'unlock') {
            return setModal('unlock');
        }

        http.post(`/api/client/servers/${uuid}/backups/${backup.uuid}/lock`)
            .then(() =>
                mutate(
                    (data) => ({
                        ...data,
                        items: data.items.map((b) =>
                            b.uuid !== backup.uuid
                                ? b
                                : {
                                    ...b,
                                    isLocked: !b.isLocked,
                                }
                        ),
                    }),
                    false
                )
            )
            .catch((error) => alert(httpErrorToHuman(error)))
            .then(() => setModal(''));
    };

    return (
        <>
            <Dialog.Confirm
                open={modal === 'unlock'}
                onClose={() => setModal('')}
                title={t('server.backups.unlock_title', '解鎖 "{{name}}"', { name: backup.name })}
                onConfirmed={onLockToggle}
            >
                {t('server.backups.unlock_description', '此備份將不再受到保護，可能會被自動或意外刪除。')}
            </Dialog.Confirm>
            <Dialog.Confirm
                open={modal === 'restore'}
                onClose={() => setModal('')}
                confirm={t('global.restore', '還原')}
                title={t('server.backups.restore_title', '還原 "{{name}}"', { name: backup.name })}
                onConfirmed={() => doRestorationAction()}
            >
                <p>
                    {t('server.backups.restore_warning', '您的伺服器將會停止。在完成之前，您將無法控制電源狀態、存取檔案管理員或建立額外的備份。')}
                </p>
                <p css={tw`mt-4 -mb-2 bg-neutral-100 dark:bg-gray-700 p-3 rounded`}>
                    <label htmlFor={'restore_truncate'} css={tw`text-base flex items-center cursor-pointer text-neutral-800 dark:text-gray-100`}>
                        <Input
                            type={'checkbox'}
                            css={tw`text-red-500! w-5! h-5! mr-2`}
                            id={'restore_truncate'}
                            value={'true'}
                            checked={truncate}
                            onChange={() => setTruncate((s) => !s)}
                        />
                        {t('server.backups.restore_truncate', '在還原備份之前刪除所有檔案。')}
                    </label>
                </p>
            </Dialog.Confirm>
            <Dialog.Confirm
                title={t('server.backups.delete_title', '刪除 "{{name}}"', { name: backup.name })}
                confirm={t('global.continue', '繼續')}
                open={modal === 'delete'}
                onClose={() => setModal('')}
                onConfirmed={doDeletion}
            >
                {t('server.backups.delete_warning', '這是一項永久性操作。備份一旦刪除將無法復原。')}
            </Dialog.Confirm>
            <SpinnerOverlay visible={loading} fixed />
            {backup.isSuccessful ? (
                <DropdownMenu
                    renderToggle={(onClick) => (
                        <button
                            onClick={onClick}
                            css={tw`text-neutral-500 dark:text-gray-200 transition-colors duration-150 hover:text-neutral-800 dark:hover:text-gray-100 p-2`}
                        >
                            <FontAwesomeIcon icon={faEllipsisH} />
                        </button>
                    )}
                >
                    <div css={tw`text-sm`}>
                        <Can action={'backup.download'}>
                            <DropdownButtonRow onClick={doDownload}>
                                <FontAwesomeIcon fixedWidth icon={faCloudDownloadAlt} css={tw`text-xs`} />
                                <span css={tw`ml-2`}>{t('global.download', '下載')}</span>
                            </DropdownButtonRow>
                        </Can>
                        <Can action={'backup.restore'}>
                            <DropdownButtonRow onClick={() => setModal('restore')}>
                                <FontAwesomeIcon fixedWidth icon={faBoxOpen} css={tw`text-xs`} />
                                <span css={tw`ml-2`}>{t('global.restore', '還原')}</span>
                            </DropdownButtonRow>
                        </Can>
                        <Can action={'backup.delete'}>
                            <>
                                <DropdownButtonRow onClick={onLockToggle}>
                                    <FontAwesomeIcon
                                        fixedWidth
                                        icon={backup.isLocked ? faUnlock : faLock}
                                        css={tw`text-xs mr-2`}
                                    />
                                    {backup.isLocked ? t('global.unlock', '解鎖') : t('global.lock', '鎖定')}
                                </DropdownButtonRow>
                                {!backup.isLocked && (
                                    <DropdownButtonRow danger onClick={() => setModal('delete')}>
                                        <FontAwesomeIcon fixedWidth icon={faTrashAlt} css={tw`text-xs`} />
                                        <span css={tw`ml-2`}>{t('global.delete', '刪除')}</span>
                                    </DropdownButtonRow>
                                )}
                            </>
                        </Can>
                    </div>
                </DropdownMenu>
            ) : (
                <button
                    onClick={() => setModal('delete')}
                    css={tw`text-neutral-500 dark:text-gray-200 transition-colors duration-150 hover:text-neutral-800 dark:hover:text-gray-100 p-2`}
                >
                    <FontAwesomeIcon icon={faTrashAlt} />
                </button>
            )}
        </>
    );
};
