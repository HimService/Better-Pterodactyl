import React from 'react';
import { Route, Switch, useRouteMatch } from 'react-router-dom';
import LoginContainer from '@/components/auth/LoginContainer';
import ForgotPasswordContainer from '@/components/auth/ForgotPasswordContainer';
import ResetPasswordContainer from '@/components/auth/ResetPasswordContainer';
import LoginCheckpointContainer from '@/components/auth/LoginCheckpointContainer';
import { NotFound } from '@/components/elements/ScreenBlock';
import { useHistory, useLocation } from 'react-router';
import { useTranslation } from 'react-i18next';
import config from '@/config';

export default () => {
    const { t } = useTranslation();
    const history = useHistory();
    const location = useLocation();
    const { path } = useRouteMatch();

    const { background_type, video_url } = config.login_visuals;

    return (
        <div className="w-full flex h-screen min-h-screen overflow-hidden relative bg-[#020617]">
            {/* Background Effects Layer - Confined to the left side visual area */}
            <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none lg:w-1/2">
                <div
                    className="absolute inset-0 z-0"
                    style={{
                        backgroundImage: background_type !== 'none' ? 'radial-gradient(circle at 50% 10%, #1e1b4b 0%, #020617 100%)' : undefined,
                    }}
                />

                {background_type === 'video' && video_url && (
                    <video
                        autoPlay
                        loop
                        muted
                        playsInline
                        className="absolute inset-0 w-full h-full object-cover opacity-60 contrast-[1.1] scale-105"
                        key={video_url}
                    >
                        <source src={video_url} type="video/mp4" />
                    </video>
                )}

                {background_type === 'particles' && (
                    <div className="absolute inset-0 opacity-50">
                        <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-brand-500/30 via-transparent to-transparent"></div>
                        <div className="particles-container w-full h-full"></div>
                    </div>
                )}

                {/* Animated Atmospheric Blobs - Only on left side */}
                <div className="absolute inset-0 opacity-100">
                    <div className="absolute top-[-10%] left-[-20%] w-[60rem] h-[60rem] bg-brand-600/30 rounded-full filter blur-[100px] animate-blob"></div>
                    <div className="absolute bottom-[-10%] left-[10%] w-[50rem] h-[50rem] bg-indigo-500/20 rounded-full filter blur-[120px] animate-blob animation-delay-2000"></div>
                </div>

                {/* Subtle overlay */}
                <div className="absolute inset-0 bg-black/20"></div>
            </div>

            <style>
                {`
                    @keyframes blob {
                        0% { transform: translate(0px, 0px) scale(1.0); }
                        33% { transform: translate(30px, -50px) scale(1.1); }
                        66% { transform: translate(-20px, 20px) scale(0.95); }
                        100% { transform: translate(0px, 0px) scale(1.0); }
                    }
                    .animate-blob {
                        animation: blob 20s infinite alternate ease-in-out;
                    }
                    .animation-delay-2000 {
                        animation-delay: 2s;
                    }
                `}
            </style>

            {/* Content Layer (Z-10) */}
            <div className="w-full h-full flex relative z-10">
                {/* Left Side: CLEAR branding showcase */}
                <div className="hidden lg:flex lg:w-1/2 relative flex-col justify-between p-12 lg:p-24 transition-all duration-1000">
                    <div className="relative z-10 flex items-center gap-4">
                        <div className="p-3 bg-white/10 rounded-2xl backdrop-blur-md shadow-2xl border border-white/10">
                            <img src={'/assets/svgs/pterodactyl.svg'} className="w-12 h-12 object-contain filter drop-shadow-md" alt="Logo" />
                        </div>
                        <div>
                            <h2 className="text-3xl font-black tracking-tight text-white drop-shadow-sm">{t('auth.better_pterodactyl')}</h2>
                            <p className="text-sm font-medium text-brand-300 uppercase tracking-widest mt-1">{t('auth.tagline')}</p>
                        </div>
                    </div>

                    <div className="relative z-10 max-w-lg mb-12">
                        <h1 className="text-5xl lg:text-7xl font-bold text-white tracking-tighter leading-[1.1] drop-shadow-lg">
                            {t('auth.intuitive')}<br />
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-300 to-indigo-400">{t('auth.convenient')}</span><br />
                            {t('auth.efficient')}
                        </h1>
                        <p className="mt-8 text-slate-300 text-lg leading-relaxed font-normal opacity-90 max-w-sm">
                            {t('auth.description')}
                        </p>
                    </div>
                </div>

                {/* Right Side: SOLID premium authentication area */}
                <div className="w-full lg:w-1/2 flex flex-col justify-center items-center p-6 sm:p-12 lg:p-24 bg-[#020617] relative z-20 shadow-[-20px_0_50px_rgba(0,0,0,0.5)] border-l border-white/5">
                    <div className="lg:hidden flex flex-col items-center mb-10 w-full max-w-md">
                        <div className="p-4 bg-white/5 rounded-3xl shadow-sm border border-white/10 mb-6 backdrop-blur-md">
                            <img src={'/assets/svgs/pterodactyl.svg'} className="w-16 h-16 drop-shadow-sm" alt="Logo" />
                        </div>
                        <h2 className="text-3xl font-black text-white tracking-tight">{t('auth.welcome_back')}</h2>
                    </div>

                    <div className="w-full max-w-md animate-fade-in-up">
                        <Switch location={location}>
                            <Route path={`${path}/login`} component={LoginContainer} exact />
                            <Route path={`${path}/login/checkpoint`} component={LoginCheckpointContainer} />
                            <Route path={`${path}/password`} component={ForgotPasswordContainer} exact />
                            <Route path={`${path}/password/reset/:token`} component={ResetPasswordContainer} />
                            <Route path={`${path}/checkpoint`} />
                            <Route path={'*'}>
                                <NotFound onBack={() => history.push('/auth/login')} />
                            </Route>
                        </Switch>
                    </div>
                </div>
            </div>
        </div>
    );
};
