import React from 'react';
import { Route } from 'react-router-dom';
import { RouteProps } from 'react-router';
import { useTranslation } from 'react-i18next';
import Can from '@/components/elements/Can';
import { ServerError } from '@/components/elements/ScreenBlock';

interface Props extends Omit<RouteProps, 'path'> {
    path: string;
    permission: string | string[] | null;
}

export default ({ permission, children, ...props }: Props) => {
    const { t } = useTranslation();

    return (
        <Route {...props}>
            {!permission ? (
                children
            ) : (
                <Can
                    matchAny
                    action={permission}
                    renderOnError={
                        <ServerError
                            title={t('global.access_denied', 'Access Denied')}
                            message={t('global.no_permission', 'You do not have permission to access this page.')}
                        />
                    }
                >
                    {children}
                </Can>
            )}
        </Route>
    );
};
