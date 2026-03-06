import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Field, Form, Formik, FormikHelpers } from 'formik';
import Switch from '@/components/elements/Switch';
import useFlash from '@/plugins/useFlash';
import FlashMessageRender from '@/components/FlashMessageRender';
import http, { httpErrorToHuman } from '@/api/http';
import Spinner from '@/components/elements/Spinner';
import Input from '@/components/elements/Input';
import Label from '@/components/elements/Label';
import styled from 'styled-components';
import tw from 'twin.macro';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSave } from '@fortawesome/free-solid-svg-icons';

const DiscordIcon = ({ size = '1em', className }: { size?: string, className?: string }) => (
    <svg width={size} height={size} viewBox="0 0 127.14 96.36" fill="currentColor" className={className}>
        <path d="M107.7,8.07A105.15,105.15,0,0,0,81.47,0a72.06,72.06,0,0,0-3.36,6.83A97.68,97.68,0,0,0,49,6.83,72.06,72.06,0,0,0,45.64,0,105.89,105.89,0,0,0,19.39,8.09C2.71,32.65-1.82,56.6.48,80.21a105.73,105.73,0,0,0,32.22,16.15,77.7,77.7,0,0,0,7.34-11.89,68.21,68.21,0,0,1-11.85-5.65c.98-.71,1.92-1.45,2.83-2.22a74.87,74.87,0,0,0,64.12,0c.91.77,1.85,1.51,2.83,2.22a68.21,68.21,0,0,1-11.85,5.65,77.7,77.7,0,0,0,7.34,11.89,105.71,105.71,0,0,0,32.22-16.15C129.09,56.6,124.55,32.65,107.7,8.07ZM42.45,65.69C36.18,65.69,31,60,31,53s5.08-12.69,11.41-12.69,11.54,5.76,11.41,12.69C53.86,60,48.72,65.69,42.45,65.69Zm42.24,0C78.41,65.69,73.23,60,73.23,53s5.08-12.69,11.41-12.69,11.54,5.76,11.41,12.69C96.05,60,91,65.69,84.69,65.69Z" />
    </svg>
);

const Container = styled.div`
    ${tw`max-w-7xl mx-auto my-8 px-4`};
`;

const Card = styled.div`
    ${tw`bg-gray-900 border border-gray-700 border-opacity-50 rounded-2xl p-8 shadow-xl mb-8`};
`;

interface Settings {
    enabled: boolean;
    client_id: string;
    client_secret: string;
    allow_registration: boolean;
    redirect_url: string;
}

const DiscordManager = () => {
    const { t } = useTranslation();
    const { addFlash, clearFlashes } = useFlash();

    const redirectUrl = `${window.location.origin}/auth/login/discord/callback`;

    const [settings, setSettings] = useState<Settings>({
        enabled: false,
        client_id: '',
        client_secret: '',
        allow_registration: false,
        redirect_url: redirectUrl,
    });
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        http.get('/admin/discord/settings')
            .then(({ data }: any) => setSettings((prev) => ({
                ...prev,
                enabled: !!data.enabled,
                client_id: data.client_id || '',
                client_secret: data.client_secret || '',
                allow_registration: !!data.allow_registration,
                redirect_url: data.redirect_url || redirectUrl,
            })))
            .catch((error) => {
                console.error(error);
                addFlash({ type: 'error', key: 'discord:error', message: t('discord.error.generic') });
            })
            .finally(() => setIsLoading(false));
    }, []);

    const submit = (values: Settings, { setSubmitting, setStatus }: FormikHelpers<Settings>) => {
        clearFlashes('discord:settings');
        setStatus(false);

        http.post('/admin/discord/settings', values)
            .then(() => {
                setStatus(true);
                addFlash({
                    type: 'success',
                    key: 'discord:settings',
                    message: t('discord.save_success'),
                });
            })
            .catch((error) => {
                console.error(error);
                addFlash({
                    type: 'error',
                    key: 'discord:settings',
                    message: httpErrorToHuman(error),
                });
            })
            .finally(() => setSubmitting(false));
    };

    if (isLoading) {
        return <Spinner centered />;
    }

    return (
        <Container>
            <Formik
                initialValues={settings}
                onSubmit={submit}
                enableReinitialize
            >
                {({ isSubmitting, status, values, setFieldValue }: any) => (
                    <Form>
                        <div tw="flex items-center space-x-3 mb-6">
                            <DiscordIcon tw="text-[#5865F2] text-2xl" />
                            <h1 tw="text-3xl font-extrabold text-white tracking-tight">{t('discord.title')}</h1>
                        </div>
                        <p tw="text-gray-400 text-lg mb-10 leading-relaxed max-w-2xl">
                            {t('discord.description')}
                        </p>

                        <FlashMessageRender byKey="discord:settings" tw="mb-8" />



                        <div tw="lg:col-span-7 space-y-8">
                            <Card>
                                <div tw="flex items-center justify-between p-2">
                                    <div tw="flex items-center space-x-4">
                                        <div tw="bg-blue-600 bg-opacity-20 p-3 rounded-2xl">
                                            <DiscordIcon tw="text-[#5865F2] text-xl" />
                                        </div>
                                        <div>
                                            <h3 tw="text-white font-bold text-xl">{t('discord.enable')}</h3>
                                            <p tw="text-gray-500 text-sm mt-1">{t('discord.enable_description')}</p>
                                        </div>
                                    </div>
                                    <Switch
                                        name="enabled"
                                        checked={values.enabled}
                                        onChange={() => setFieldValue('enabled', !values.enabled)}
                                    />
                                </div>

                                <hr tw="border-gray-700 border-opacity-50 my-8" />

                                <div tw="space-y-6">
                                    <div tw="flex items-center space-x-3 mb-2">
                                        <div tw="w-1 h-6 bg-blue-500 rounded-full" />
                                        <h4 tw="text-white font-bold uppercase tracking-wider text-sm">{t('discord.api_settings')}</h4>
                                    </div>

                                    <div>
                                        <Label tw="mb-2 block text-gray-400">{t('discord.client_id')}</Label>
                                        <Input
                                            name="client_id"
                                            value={values.client_id}
                                            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFieldValue('client_id', e.target.value)}
                                            placeholder="123456789012345678"
                                            tw="bg-gray-800 bg-opacity-50 border-gray-700 focus:border-blue-500 transition-colors"
                                        />
                                    </div>

                                    <div>
                                        <Label tw="mb-2 block text-gray-400">{t('discord.client_secret')}</Label>
                                        <Input
                                            name="client_secret"
                                            value={values.client_secret}
                                            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFieldValue('client_secret', e.target.value)}
                                            type="password"
                                            placeholder="••••••••••••••••"
                                            tw="bg-gray-800 bg-opacity-50 border-gray-700 focus:border-blue-500 transition-colors"
                                        />
                                    </div>

                                    <div>
                                        <Label tw="mb-2 block text-gray-400">{t('discord.redirect_url')}</Label>
                                        <Input
                                            name="redirect_url"
                                            value={values.redirect_url}
                                            readOnly
                                            onClick={(e: React.MouseEvent<HTMLInputElement>) => (e.target as HTMLInputElement).select()}
                                            tw="bg-gray-800 bg-opacity-50 border-gray-700 text-gray-500 cursor-default"
                                        />
                                        <p tw="text-gray-500 text-xs mt-2 italic">
                                            {t('discord.redirect_url_help')}
                                        </p>
                                    </div>
                                </div>
                            </Card>
                        </div>

                        <div tw="lg:col-span-5">
                            <Card tw="h-full">
                                <div tw="flex items-center justify-between p-2">
                                    <div tw="flex items-center space-x-4">
                                        <div tw="bg-blue-500 bg-opacity-20 p-3 rounded-2xl text-blue-500">
                                            <FontAwesomeIcon icon={faSave} tw="text-xl" />
                                        </div>
                                        <div>
                                            <h3 tw="text-white font-bold text-xl">{t('discord.allow_registration')}</h3>
                                            <p tw="text-gray-500 text-sm mt-1">{t('discord.allow_registration_help')}</p>
                                        </div>
                                    </div>
                                    <Switch
                                        name="allow_registration"
                                        checked={values.allow_registration}
                                        onChange={() => setFieldValue('allow_registration', !values.allow_registration)}
                                    />
                                </div>
                            </Card>
                        </div>

                        <div tw="lg:col-span-12 flex justify-end mt-4">
                            <button
                                type="submit"
                                disabled={isSubmitting}
                                tw="bg-blue-600 hover:bg-blue-500 text-white font-bold py-4 px-10 rounded-2xl shadow-lg transition-all flex items-center space-x-3 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {isSubmitting ? (
                                    <>
                                        <Spinner size="small" tw="mr-2" />
                                        <span>{t('common.saving')}</span>
                                    </>
                                ) : (
                                    <>
                                        <FontAwesomeIcon icon={faSave} tw="mr-2" />
                                        <span>{t('common.save')}</span>
                                    </>
                                )}
                            </button>
                        </div>
                    </Form>
                )}
            </Formik>
        </Container>
    );
};

export default DiscordManager;
