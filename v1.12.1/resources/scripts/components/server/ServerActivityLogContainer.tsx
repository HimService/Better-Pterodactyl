import React, { useEffect, useState } from 'react';
import { useActivityLogs } from '@/api/server/activity';
import ServerContentBlock from '@/components/elements/ServerContentBlock';
import { useFlashKey } from '@/plugins/useFlash';
import FlashMessageRender from '@/components/FlashMessageRender';
import Spinner from '@/components/elements/Spinner';
import ActivityLogEntry from '@/components/elements/activity/ActivityLogEntry';
import PaginationFooter from '@/components/elements/table/PaginationFooter';
import { ActivityLogFilters } from '@/api/account/activity';
import { Link } from 'react-router-dom';
import classNames from 'classnames';
import { styles as btnStyles } from '@/components/elements/button/index';
import { XCircleIcon } from '@heroicons/react/solid';
import useLocationHash from '@/plugins/useLocationHash';
import { useTranslation } from 'react-i18next';

export default () => {
    const { t } = useTranslation();
    const { hash } = useLocationHash();
    const { clearAndAddHttpError } = useFlashKey('server:activity');
    const [filters, setFilters] = useState<ActivityLogFilters>({ page: 1, sorts: { timestamp: -1 } });

    const { data, isValidating, error } = useActivityLogs(filters, {
        revalidateOnMount: true,
        revalidateOnFocus: false,
    });

    useEffect(() => {
        setFilters((value) => ({ ...value, filters: { ip: hash.ip, event: hash.event } }));
    }, [hash]);

    useEffect(() => {
        clearAndAddHttpError(error);
    }, [error]);

    return (
        <ServerContentBlock title={t('activity.header', 'Activity Log')}>
            <FlashMessageRender byKey={'server:activity'} />
            {(filters.filters?.event || filters.filters?.ip) && (
                <div className={'flex justify-end mb-2'}>
                    <Link
                        to={'#'}
                        className={classNames(btnStyles.button, btnStyles.text, 'w-full sm:w-auto')}
                        onClick={() => setFilters((value) => ({ ...value, filters: {} }))}
                    >
                        {t('dashboard.account_activity.clear_filters', 'Clear Filters')} <XCircleIcon className={'w-4 h-4 ml-2'} />
                    </Link>
                </div>
            )}
            {!data && isValidating ? (
                <Spinner centered />
            ) : !data?.items.length ? (
                <p className={'text-sm text-center text-gray-400'}>{t('activity.no_logs', 'No activity logs available for this server.')}</p>
            ) : (
                <div className={'bg-neutral-50 dark:bg-neutral-900/50 overflow-hidden rounded-xl border border-neutral-200 dark:border-neutral-800 shadow-sm'}>
                    {data?.items.map((activity) => (
                        <ActivityLogEntry key={activity.id} activity={activity}>
                            <span />
                        </ActivityLogEntry>
                    ))}
                </div>
            )}
            {data && (
                <PaginationFooter
                    pagination={data.pagination}
                    onPageSelect={(page) => setFilters((value) => ({ ...value, page }))}
                />
            )}
        </ServerContentBlock>
    );
};
