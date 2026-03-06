import React, { memo } from 'react';
import { ServerContext } from '@/state/server';
import Can from '@/components/elements/Can';
import isEqual from 'react-fast-compare';
import Spinner from '@/components/elements/Spinner';
import Console from '@/components/server/console/Console';
import PowerButtons from '@/components/server/console/PowerButtons';
import ServerDetailsBlock from '@/components/server/console/ServerDetailsBlock';
import { useTranslation } from 'react-i18next';
import styled from 'styled-components/macro';

const PopoutWrapper = styled.div`
    @media (max-width: 640px) {
        padding: 1rem;
    }
    padding: 2rem;
    width: 100%;
    min-height: 100vh;
    background-color: var(--color-neutral-900);
`;

const ConsolePopoutContainer = () => {
    const { t } = useTranslation('frontend');
    const name = ServerContext.useStoreState((state) => state.server.data!.name);

    return (
        <PopoutWrapper>
            <div className={'flex items-center justify-between mb-4'}>
                <h1 className={'font-header font-medium text-xl text-neutral-50 leading-relaxed overflow-hidden whitespace-nowrap overflow-ellipsis'}>
                    {name} - {t('server.console.title', 'Console')}
                </h1>
                <Can action={['control.start', 'control.stop', 'control.restart']} matchAny>
                    <PowerButtons className={'flex space-x-2'} />
                </Can>
            </div>
            <div className={'grid grid-cols-4 gap-4 sm:gap-6'}>
                <div className={'col-span-4 lg:col-span-3 rounded-[1.25rem] p-1 bg-black/40 ring-1 ring-white/10 backdrop-blur-md shadow-2xl'}>
                    <div className="w-full h-full rounded-xl overflow-hidden bg-black/90">
                        <Spinner.Suspense>
                            <Console />
                        </Spinner.Suspense>
                    </div>
                </div>
                <ServerDetailsBlock className={'col-span-4 lg:col-span-1'} />
            </div>
        </PopoutWrapper>
    );
};

export default memo(ConsolePopoutContainer, isEqual);
