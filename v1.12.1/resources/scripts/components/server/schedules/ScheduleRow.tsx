import React from 'react';
import { Schedule } from '@/api/server/schedules/getServerSchedules';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faBolt, faCalendarAlt, faGlobe, faRobot } from '@fortawesome/free-solid-svg-icons';
import { format } from 'date-fns';
import tw from 'twin.macro';
import ScheduleCronRow from '@/components/server/schedules/ScheduleCronRow';
import { useTranslation } from 'react-i18next';
import { useEffect, useState } from 'react';
import getScheduleConditions from '@/api/server/schedules/getScheduleConditions';
import { ServerContext } from '@/state/server';

export default ({ schedule }: { schedule: Schedule }) => {
    const { t } = useTranslation();
    const uuid = ServerContext.useStoreState((state) => state.server.data!.uuid);
    const [hasConditions, setHasConditions] = useState(false);

    useEffect(() => {
        getScheduleConditions(uuid, schedule.id)
            .then(data => setHasConditions(data.conditions.length > 0))
            .catch(() => setHasConditions(false));
    }, [schedule.id]);

    return (
        <>
            <div className="icon hidden md:flex">
                <FontAwesomeIcon icon={faCalendarAlt} fixedWidth />
            </div>
            <div css={tw`flex-1 md:ml-4`}>
                <p>{schedule.name}</p>
                <p css={tw`text-xs text-neutral-400`}>
                    {t('server.schedules.last_run_at', 'Last run at:')} {schedule.lastRunAt ? format(schedule.lastRunAt, "MMM do 'at' h:mma") : t('server.schedules.never', 'never')}
                </p>
                <div css={tw`mt-2 flex items-center`}>
                    {schedule.onlyWhenOnline ? (
                        <div
                            translate="no"
                            css={[
                                tw`flex items-center px-2 py-0.5 rounded-full text-[10px] uppercase font-bold tracking-wider transition-all duration-300`,
                                tw`border text-yellow-500`,
                                {
                                    backgroundColor: 'rgba(245, 158, 11, 0.1)',
                                    borderColor: 'rgba(245, 158, 11, 0.3)',
                                    backdropFilter: 'blur(8px)',
                                    boxShadow: '0 0 10px rgba(245, 158, 11, 0.1)',
                                },
                            ]}
                        >
                            <FontAwesomeIcon icon={faGlobe} css={tw`mr-1.5 text-[9px]`} />
                            {t('server.schedules.status_online_only', 'Online only')}
                        </div>
                    ) : (
                        <div
                            translate="no"
                            css={[
                                tw`flex items-center px-2 py-0.5 rounded-full text-[10px] uppercase font-bold tracking-wider transition-all duration-300`,
                                tw`border text-green-500`,
                                {
                                    backgroundColor: 'rgba(16, 185, 129, 0.1)',
                                    borderColor: 'rgba(16, 185, 129, 0.3)',
                                    backdropFilter: 'blur(8px)',
                                    boxShadow: '0 0 10px rgba(16, 185, 129, 0.1)',
                                },
                            ]}
                        >
                            <FontAwesomeIcon icon={faBolt} css={tw`mr-1.5 text-[9px]`} />
                            {t('server.schedules.status_always', 'Always')}
                        </div>
                    )}
                    {hasConditions && (
                        <div
                            translate="no"
                            css={[
                                tw`flex items-center px-2 py-0.5 rounded-full text-[10px] uppercase font-bold tracking-wider transition-all duration-300 ml-2`,
                                tw`border text-purple-400`,
                                {
                                    backgroundColor: 'rgba(139, 92, 246, 0.1)',
                                    borderColor: 'rgba(139, 92, 246, 0.3)',
                                    backdropFilter: 'blur(8px)',
                                    boxShadow: '0 0 10px rgba(139, 92, 246, 0.1)',
                                },
                            ]}
                        >
                            <FontAwesomeIcon icon={faRobot} css={tw`mr-1.5 text-[9px]`} />
                            {t('server.schedules.conditions_header', 'Smart')}
                        </div>
                    )}
                </div>
            </div>
            <div>
                <p
                    css={[
                        tw`py-1 px-3 rounded text-xs uppercase text-white sm:hidden`,
                        schedule.isActive ? tw`bg-green-600` : tw`bg-neutral-400`,
                    ]}
                >
                    {schedule.isActive ? t('server.schedules.active', 'Active') : t('server.schedules.inactive', 'Inactive')}
                </p>
            </div>
            <ScheduleCronRow cron={schedule.cron} css={tw`mx-auto sm:mx-8 w-full sm:w-auto mt-4 sm:mt-0`} />
            <div>
                <p
                    css={[
                        tw`py-1 px-3 rounded text-xs uppercase text-white hidden sm:block`,
                        schedule.isActive && !schedule.isProcessing ? tw`bg-green-600` : tw`bg-neutral-400`,
                    ]}
                >
                    {schedule.isProcessing ? t('server.schedules.processing', 'Processing') : schedule.isActive ? t('server.schedules.active', 'Active') : t('server.schedules.inactive', 'Inactive')}
                </p>
            </div>
        </>
    );
};
