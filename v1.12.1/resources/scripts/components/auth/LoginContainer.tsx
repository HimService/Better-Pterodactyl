import React, { useEffect, useRef, useState } from 'react';
import { Link, RouteComponentProps, useLocation } from 'react-router-dom';
import login from '@/api/auth/login';
import LoginFormContainer from '@/components/auth/LoginFormContainer';
import { useStoreState } from 'easy-peasy';
import { Formik, FormikHelpers } from 'formik';
import { object, string } from 'yup';
import Field from '@/components/elements/Field';
import tw from 'twin.macro';
import PluginSlot from '@/components/elements/plugins/PluginSlot';
import Button from '@/components/elements/Button';
import Reaptcha from 'reaptcha';
import useFlash from '@/plugins/useFlash';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import config from '@/config';
import axios from 'axios';

const DiscordIcon = ({ size = '1em' }: { size?: string }) => (
    <svg width={size} height={size} viewBox="0 0 127.14 96.36" fill="currentColor">
        <path d="M107.7,8.07A105.15,105.15,0,0,0,81.47,0a72.06,72.06,0,0,0-3.36,6.83A97.68,97.68,0,0,0,49,6.83,72.06,72.06,0,0,0,45.64,0,105.89,105.89,0,0,0,19.39,8.09C2.71,32.65-1.82,56.6.48,80.21a105.73,105.73,0,0,0,32.22,16.15,77.7,77.7,0,0,0,7.34-11.89,68.21,68.21,0,0,1-11.85-5.65c.98-.71,1.92-1.45,2.83-2.22a74.87,74.87,0,0,0,64.12,0c.91.77,1.85,1.51,2.83,2.22a68.21,68.21,0,0,1-11.85,5.65,77.7,77.7,0,0,0,7.34,11.89,105.71,105.71,0,0,0,32.22-16.15C129.09,56.6,124.55,32.65,107.7,8.07ZM42.45,65.69C36.18,65.69,31,60,31,53s5.08-12.69,11.41-12.69,11.54,5.76,11.41,12.69C53.86,60,48.72,65.69,42.45,65.69Zm42.24,0C78.41,65.69,73.23,60,73.23,53s5.08-12.69,11.41-12.69,11.54,5.76,11.41,12.69C96.05,60,91,65.69,84.69,65.69Z" />
    </svg>
);

interface Values {
    username: string;
    password: string;
}

const LoginContainer = ({ history }: RouteComponentProps) => {
    const { t } = useTranslation();
    const location = useLocation();
    const ref = useRef<Reaptcha>(null);
    const turnstileRef = useRef<HTMLDivElement>(null);
    const [token, setToken] = useState('');

    const { clearFlashes, clearAndAddHttpError, addFlash } = useFlash();
    const { enabled: verificationEnabled, siteKey, verification_type: verificationType, turnstile_site_key: turnstileSiteKey } = useStoreState((state) => state.settings.data?.recaptcha || { enabled: false, siteKey: '', verification_type: 'recaptcha', turnstile_site_key: '' });
    const [discordEnabled, setDiscordEnabled] = useState(false);

    const [turnstileLoaded, setTurnstileLoaded] = useState(false);

    useEffect(() => {
        console.log('Verification Settings:', { verificationEnabled, verificationType, turnstileSiteKey });
        clearFlashes();

        // Handle Discord errors from query parameters
        // ... (params logic)
    }, [verificationEnabled, verificationType, turnstileSiteKey]);

    useEffect(() => {
        // Load Turnstile script if needed
        if (verificationEnabled && verificationType === 'turnstile') {
            if ('turnstile' in window) {
                console.log('Turnstile already loaded');
                setTurnstileLoaded(true);
            } else {
                console.log('Loading Turnstile script...');
                const script = document.createElement('script');
                script.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';
                script.async = true;
                script.defer = true;
                script.onload = () => {
                    console.log('Turnstile script loaded');
                    setTurnstileLoaded(true);
                };
                script.onerror = (err) => console.error('Turnstile script load error:', err);
                document.body.appendChild(script);
            }
        }
    }, [verificationEnabled, verificationType]);

    useEffect(() => {
        if (verificationEnabled && verificationType === 'turnstile' && turnstileRef.current && turnstileLoaded && (window as any).turnstile) {
            console.log('Rendering Turnstile widget...');
            try {
                (window as any).turnstile.render(turnstileRef.current, {
                    sitekey: turnstileSiteKey,
                    callback: (token: string) => {
                        console.log('Turnstile token received');
                        setToken(token);
                    },
                    'expired-callback': () => {
                        console.log('Turnstile token expired');
                        setToken('');
                    },
                    'error-callback': () => {
                        console.log('Turnstile error');
                        setToken('');
                    },
                });
            } catch (e) {
                console.error('Turnstile render error:', e);
            }
        }
    }, [verificationEnabled, verificationType, turnstileRef.current, turnstileLoaded]);

    const onSubmit = (values: Values, { setSubmitting }: FormikHelpers<Values>) => {
        clearFlashes();

        // If there is no token in the state yet, request the token and then abort this submit request
        // since it will be re-submitted when the recaptcha data is returned by the component.
        if (verificationEnabled && !token) {
            if (verificationType === 'recaptcha') {
                ref.current!.execute().catch((error) => {
                    console.error(error);
                    setSubmitting(false);
                    clearAndAddHttpError({ error });
                });
            } else {
                // Turnstile is usually pre-filled or handled by the callback, but if not:
                addFlash({ type: 'error', message: t('auth.login.verification_required', 'Please complete the website verification.'), key: 'auth.login' });
                setSubmitting(false);
            }

            return;
        }

        login({ ...values, recaptchaData: token })
            .then((response) => {
                if (response.complete) {
                    // @ts-expect-error this is valid
                    window.location = response.intended || '/';
                    return;
                }

                history.replace('/auth/login/checkpoint', { token: response.confirmationToken });
            })
            .catch((error) => {
                console.error(error);

                setToken('');
                if (ref.current) ref.current.reset();
                if (verificationType === 'turnstile' && (window as any).turnstile) {
                    (window as any).turnstile.reset();
                }

                setSubmitting(false);
                clearAndAddHttpError({ error });
            });
    };

    return (
        <Formik
            onSubmit={onSubmit}
            initialValues={{ username: '', password: '' }}
            validationSchema={object().shape({
                username: string().required(t('auth.login.username_required', 'A username or email must be provided.')),
                password: string().required(t('auth.login.password_required', 'Please enter your account password.')),
            })}
        >
            {({ isSubmitting, setSubmitting, submitForm }) => (
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, ease: 'easeOut' }}
                    className="w-full relative"
                >
                    {config.login_visuals.glow_borders && (
                        <div className="absolute -inset-0.5 bg-gradient-to-r from-brand-500 to-indigo-500 rounded-2xl blur opacity-20 group-hover:opacity-40 transition duration-1000 group-hover:duration-200 animate-tilt pointer-events-none"></div>
                    )}
                    <LoginFormContainer
                        title={t('auth.login.title', 'Login to Continue')}
                        className={config.login_visuals.glow_borders ? 'relative group' : 'relative'}
                        css={tw`w-full flex`}
                    >
                        <PluginSlot id="login_top" />
                        <Field type={'text'} label={t('auth.login.username', 'Username or Email')} name={'username'} disabled={isSubmitting} />
                        <div css={tw`mt-6`}>
                            <Field type={'password'} label={t('auth.login.password', 'Password')} name={'password'} disabled={isSubmitting} />
                        </div>
                        <div css={tw`mt-6`}>
                            <Button type={'submit'} size={'xlarge'} isLoading={isSubmitting} disabled={isSubmitting}>
                                {t('auth.login.login_button', 'Login')}
                            </Button>
                        </div>
                        {discordEnabled && (
                            <>
                                <div css={tw`mt-6 flex items-center`}>
                                    <div css={tw`flex-grow border-t border-neutral-700`}></div>
                                    <span css={tw`px-4 text-xs text-neutral-500 uppercase tracking-widest text-center`}>{t('discord.or', { defaultValue: '或者' })}</span>
                                    <div css={tw`flex-grow border-t border-neutral-700`}></div>
                                </div>
                                <div css={tw`mt-6`}>
                                    <Button
                                        type={'button'}
                                        size={'xlarge'}
                                        css={tw`bg-[#5865F2]! hover:bg-[#4752C4]! border-none shadow-lg hover:shadow-[#5865F2] transition-all duration-300 transform hover:-translate-y-0.5 normal-case! h-14!`}
                                        onClick={() => window.location.href = '/api/discord/login'}
                                    >
                                        <div css={tw`flex items-center justify-center gap-3 w-full`}>
                                            <DiscordIcon size={'24px'} />
                                            <span css={tw`font-semibold tracking-wide text-base`}>
                                                {t('discord.login_with_discord')}
                                            </span>
                                        </div>
                                    </Button>
                                </div>
                            </>
                        )}
                        {verificationEnabled && verificationType === 'recaptcha' && (
                            <Reaptcha
                                ref={ref}
                                size={'invisible'}
                                sitekey={siteKey || '_invalid_key'}
                                onVerify={(response) => {
                                    setToken(response);
                                    submitForm();
                                }}
                                onExpire={() => {
                                    setSubmitting(false);
                                    setToken('');
                                }}
                            />
                        )}
                        {verificationEnabled && verificationType === 'turnstile' && (
                            <div css={tw`mt-6 flex justify-center`}>
                                <div ref={turnstileRef} />
                            </div>
                        )}
                        <div css={tw`mt-6 text-center`}>
                            <Link
                                to={'/auth/password'}
                                css={tw`text-xs text-neutral-500 tracking-wide no-underline uppercase hover:text-neutral-600`}
                            >
                                {t('auth.login.forgot_password', 'Forgot password?')}
                            </Link>
                        </div>
                        <PluginSlot id="login_bottom" />
                    </LoginFormContainer>
                </motion.div>
            )}
        </Formik>
    );
};

export default LoginContainer;
