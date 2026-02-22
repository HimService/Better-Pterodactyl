import React from 'react';
import { ServerContext } from '@/state/server';
import ScreenBlock from '@/components/elements/ScreenBlock';
import ServerInstallSvg from '@/assets/images/server_installing.svg';
import ServerErrorSvg from '@/assets/images/server_error.svg';
import ServerRestoreSvg from '@/assets/images/server_restore.svg';
import { useTranslation } from 'react-i18next';

export default () => {
    const { t } = useTranslation();
    const status = ServerContext.useStoreState((state) => state.server.data?.status || null);
    const isTransferring = ServerContext.useStoreState((state) => state.server.data?.isTransferring || false);
    const isNodeUnderMaintenance = ServerContext.useStoreState(
        (state) => state.server.data?.isNodeUnderMaintenance || false
    );

    return status === 'installing' || status === 'install_failed' || status === 'reinstall_failed' ? (
        <ScreenBlock
            title={t('server.conflict.installing_title', 'Running Installer')}
            image={ServerInstallSvg}
            message={t('server.conflict.installing_msg', 'Your server should be ready soon, please try again in a few minutes.')}
        />
    ) : status === 'suspended' ? (
        <ScreenBlock
            title={t('server.conflict.suspended_title', 'Server Suspended')}
            image={ServerErrorSvg}
            message={t('server.conflict.suspended_msg', 'This server is suspended and cannot be accessed.')}
        />
    ) : isNodeUnderMaintenance ? (
        <ScreenBlock
            title={t('server.conflict.maintenance_title', 'Node under Maintenance')}
            image={ServerErrorSvg}
            message={t('server.conflict.maintenance_msg', 'The node of this server is currently under maintenance.')}
        />
    ) : (
        <ScreenBlock
            title={isTransferring ? t('server.conflict.transferring_title', 'Transferring') : t('server.conflict.restoring_title', 'Restoring from Backup')}
            image={ServerRestoreSvg}
            message={
                isTransferring
                    ? t('server.conflict.transferring_msg', 'Your server is being transferred to a new node, please check back later.')
                    : t('server.conflict.restoring_msg', 'Your server is currently being restored from a backup, please check back in a few minutes.')
            }
        />
    );
};
