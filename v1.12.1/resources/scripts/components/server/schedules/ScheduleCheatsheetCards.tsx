import React from 'react';
import tw from 'twin.macro';
import { useTranslation } from 'react-i18next';

export default () => {
    const { t } = useTranslation();

    return (
        <>
            <div css={tw`md:w-1/2 h-full bg-neutral-100 dark:bg-neutral-600 border border-neutral-200 dark:border-neutral-800 transition-colors duration-300`}>
                <div css={tw`flex flex-col`}>
                    <h2 css={tw`py-4 px-6 font-bold`}>{t('server.schedules.cheatsheet.examples')}</h2>
                    <div css={tw`flex py-4 px-6 bg-neutral-200 dark:bg-neutral-500 transition-colors duration-300`}>
                        <div css={tw`w-1/2`}>*/5 * * * *</div>
                        <div css={tw`w-1/2`}>{t('server.schedules.cheatsheet.every_5_minutes')}</div>
                    </div>
                    <div css={tw`flex py-4 px-6`}>
                        <div css={tw`w-1/2`}>0 */1 * * *</div>
                        <div css={tw`w-1/2`}>{t('server.schedules.cheatsheet.every_hour')}</div>
                    </div>
                    <div css={tw`flex py-4 px-6 bg-neutral-200 dark:bg-neutral-500 transition-colors duration-300`}>
                        <div css={tw`w-1/2`}>0 8-12 * * *</div>
                        <div css={tw`w-1/2`}>{t('server.schedules.cheatsheet.hour_range')}</div>
                    </div>
                    <div css={tw`flex py-4 px-6`}>
                        <div css={tw`w-1/2`}>0 0 * * *</div>
                        <div css={tw`w-1/2`}>{t('server.schedules.cheatsheet.once_a_day')}</div>
                    </div>
                    <div css={tw`flex py-4 px-6 bg-neutral-200 dark:bg-neutral-500 transition-colors duration-300`}>
                        <div css={tw`w-1/2`}>0 0 * * MON</div>
                        <div css={tw`w-1/2`}>{t('server.schedules.cheatsheet.every_monday')}</div>
                    </div>
                </div>
            </div>
            <div css={tw`md:w-1/2 h-full bg-neutral-100 dark:bg-neutral-600 border border-neutral-200 dark:border-neutral-800 transition-colors duration-300`}>
                <h2 css={tw`py-4 px-6 font-bold`}>{t('server.schedules.cheatsheet.special_characters')}</h2>
                <div css={tw`flex flex-col`}>
                    <div css={tw`flex py-4 px-6 bg-neutral-200 dark:bg-neutral-500 transition-colors duration-300`}>
                        <div css={tw`w-1/2`}>*</div>
                        <div css={tw`w-1/2`}>{t('server.schedules.cheatsheet.any_value')}</div>
                    </div>
                    <div css={tw`flex py-4 px-6`}>
                        <div css={tw`w-1/2`}>,</div>
                        <div css={tw`w-1/2`}>{t('server.schedules.cheatsheet.value_list_separator')}</div>
                    </div>
                    <div css={tw`flex py-4 px-6 bg-neutral-200 dark:bg-neutral-500 transition-colors duration-300`}>
                        <div css={tw`w-1/2`}>-</div>
                        <div css={tw`w-1/2`}>{t('server.schedules.cheatsheet.range_values')}</div>
                    </div>
                    <div css={tw`flex py-4 px-6`}>
                        <div css={tw`w-1/2`}>/</div>
                        <div css={tw`w-1/2`}>{t('server.schedules.cheatsheet.step_values')}</div>
                    </div>
                </div>
            </div>
        </>
    );
};
