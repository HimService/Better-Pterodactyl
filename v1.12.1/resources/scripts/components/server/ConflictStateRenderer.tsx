import React, { useState, useEffect } from 'react';
import { ServerContext } from '@/state/server';
import ScreenBlock from '@/components/elements/ScreenBlock';
import ServerInstallSvg from '@/assets/images/server_installing.svg';
import ServerErrorSvg from '@/assets/images/server_error.svg';
import ServerRestoreSvg from '@/assets/images/server_restore.svg';
import { useTranslation } from 'react-i18next';
import Button from '@/components/elements/Button';
import { Actions, useStoreActions } from 'easy-peasy';
import { ApplicationStore } from '@/state';
import http from '@/api/http';
import { Dialog } from '@/components/elements/dialog';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faFileInvoiceDollar } from '@fortawesome/free-solid-svg-icons';

export default () => {
    const { t } = useTranslation();
    const [isRenewing, setIsRenewing] = useState(false);
    const [renewalResult, setRenewalResult] = useState<{ success: boolean; message: string } | null>(null);
    const [billingEnabled, setBillingEnabled] = useState(false);

    const id = ServerContext.useStoreState((state) => state.server.data?.id);
    const uuid = ServerContext.useStoreState((state) => state.server.data?.uuid);
    const status = ServerContext.useStoreState((state) => state.server.data?.status || null);

    useEffect(() => {
        if (!uuid) return;
        http.get(`/api/client/servers/${uuid}/billing`)
            .then((res: any) => setBillingEnabled(res.data?.enabled || false))
            .catch((error) => console.error(error));
    }, [uuid]);

    const isTransferring = ServerContext.useStoreState((state) => state.server.data?.isTransferring || false);
    const isNodeUnderMaintenance = ServerContext.useStoreState(
        (state) => state.server.data?.isNodeUnderMaintenance || false
    );

    const { addFlash, clearFlashes } = useStoreActions((actions: Actions<ApplicationStore>) => actions.flashes);

    const doRenew = () => {
        if (!uuid) return;

        setIsRenewing(true);
        clearFlashes('server:billing');

        http.post(`/api/client/servers/${uuid}/billing/renew`)
            .then(() => {
                addFlash({
                    type: 'success',
                    key: 'server:billing',
                    message: '成功為伺服器續繳費用！伺服器已解除停權。'
                });
                setRenewalResult({ success: true, message: '成功為伺服器續繳費用！伺服器已解除停權，請重新整理頁面。' });
            })
            .catch((error) => {
                const rawMsg = error.response?.data?.error;
                let msg = '續費失敗，請確認您的餘額或稍後再試。';

                if (rawMsg === 'Insufficient balance') {
                    msg = t('economy.insufficient_balance', '餘額不足，請先儲值。');
                } else if (rawMsg === 'Server not linked to billing') {
                    msg = t('economy.not_linked_billing', '此伺服器尚未連結計費。');
                } else if (rawMsg) {
                    msg = rawMsg;
                }

                addFlash({
                    type: 'error',
                    key: 'server:billing',
                    message: msg
                });
                setRenewalResult({ success: false, message: msg });
            })
            .then(() => setIsRenewing(false));
    };

    if (status === 'installing' || status === 'install_failed' || status === 'reinstall_failed') {
        return (
            <ScreenBlock
                title={t('server.conflict.installing_title', 'Running Installer')}
                image={ServerInstallSvg}
                message={t('server.conflict.installing_msg', 'Your server should be ready soon, please try again in a few minutes.')}
            />
        );
    }

    if (status === 'suspended') {
        return (
            <ScreenBlock
                title={t('server.conflict.suspended_title', 'Server Suspended')}
                image={ServerErrorSvg}
                message={t('server.conflict.suspended_msg', 'This server is suspended and cannot be accessed.')}
            >
                {billingEnabled && (
                    <>
                        <div className={'mt-8 flex flex-col items-center justify-center'}>
                            <p className={'text-sm text-neutral-400 mb-4'}>此伺服器可能因欠費已被系統自動停權，您可以嘗試手動續繳以解除停權。</p>
                            <Button
                                color={'primary'}
                                onClick={doRenew}
                                disabled={isRenewing}
                                className={'flex items-center gap-2 px-8 py-3 rounded-full shadow-lg transition-transform hover:scale-105 active:scale-95'}
                            >
                                <FontAwesomeIcon icon={faFileInvoiceDollar} />
                                {isRenewing ? '處理中...' : '立即續費贖回伺服器'}
                            </Button>
                        </div>
                        <Dialog
                            open={!!renewalResult}
                            onClose={() => renewalResult?.success ? window.location.reload() : setRenewalResult(null)}
                            title={renewalResult?.success ? '續費成功' : '續費失敗'}
                        >
                            <div className={'pb-4'}>
                                <p className={'text-neutral-200'}>{renewalResult?.message}</p>
                            </div>
                            <Dialog.Footer>
                                <Button onClick={() => renewalResult?.success ? window.location.reload() : setRenewalResult(null)}>
                                    {renewalResult?.success ? '重新整理介面' : '確認'}
                                </Button>
                            </Dialog.Footer>
                        </Dialog>
                    </>
                )}
            </ScreenBlock>
        );
    }

    if (isNodeUnderMaintenance) {
        return (
            <ScreenBlock
                title={t('server.conflict.maintenance_title', 'Node under Maintenance')}
                image={ServerErrorSvg}
                message={t('server.conflict.maintenance_msg', 'The node of this server is currently under maintenance.')}
            />
        );
    }

    return (
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
