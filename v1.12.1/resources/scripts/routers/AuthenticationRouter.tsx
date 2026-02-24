import React from 'react';
import { Route, Switch, useRouteMatch } from 'react-router-dom';
import LoginContainer from '@/components/auth/LoginContainer';
import ForgotPasswordContainer from '@/components/auth/ForgotPasswordContainer';
import ResetPasswordContainer from '@/components/auth/ResetPasswordContainer';
import LoginCheckpointContainer from '@/components/auth/LoginCheckpointContainer';
import { NotFound } from '@/components/elements/ScreenBlock';
import { useHistory, useLocation } from 'react-router';
import { useTranslation } from 'react-i18next';

export default () => {
    const { t } = useTranslation();
    const history = useHistory();
    const location = useLocation();
    const { path } = useRouteMatch();

    return (
        <div className="w-full flex h-screen min-h-screen transition-colors duration-500 bg-neutral-50 dark:bg-[#0f172a] overflow-hidden">
            {/* Inject Custom Keyframes for Premium Animations */}
            <style>
                {`
                    @keyframes blob {
                        0% { transform: translate(0px, 0px) scale(1); }
                        33% { transform: translate(30px, -50px) scale(1.1); }
                        66% { transform: translate(-20px, 20px) scale(0.9); }
                        100% { transform: translate(0px, 0px) scale(1); }
                    }
                    .animate-blob {
                        animation: blob 15s infinite alternate ease-in-out;
                    }
                    .animation-delay-2000 {
                        animation-delay: 2s;
                    }
                    .animation-delay-4000 {
                        animation-delay: 4s;
                    }
                `}
            </style>

            {/* Left Decorative Pane (Hidden on Mobile) */}
            <div className="hidden lg:flex lg:w-1/2 relative flex-col justify-between overflow-hidden bg-[#020617] p-12 lg:p-24 border-r border-white/5 shadow-2xl">

                {/* Dynamic Floating Glowing Orbs */}
                <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none mix-blend-screen opacity-80 dark:opacity-60">
                    {/* Top Left Orb */}
                    <div className="absolute top-[-10%] left-[-10%] w-96 h-96 bg-brand-600/40 rounded-full mix-blend-lighten filter blur-[100px] animate-blob"></div>
                    {/* Top Right Orb */}
                    <div className="absolute top-[-10%] right-[-10%] w-96 h-96 bg-indigo-500/40 rounded-full mix-blend-lighten filter blur-[100px] animate-blob animation-delay-2000"></div>
                    {/* Bottom Left Orb */}
                    <div className="absolute bottom-[-20%] left-[20%] w-[30rem] h-[30rem] bg-purple-600/30 rounded-full mix-blend-lighten filter blur-[120px] animate-blob animation-delay-4000"></div>
                </div>

                {/* Overlay ambient texture (Removed noise.png due to missing asset) */}
                <div className="absolute inset-0 z-0 opacity-[0.03] mix-blend-overlay bg-black"></div>

                {/* Top content */}
                <div className="relative z-10 flex items-center gap-4">
                    <div className="p-3 bg-white/10 rounded-2xl backdrop-blur-md shadow-2xl border border-white/10">
                        <img src={'/assets/svgs/pterodactyl.svg'} className="w-12 h-12 object-contain filter drop-shadow-md" alt="Logo" />
                    </div>
                    <div>
                        <h2 className="text-3xl font-black tracking-tight text-white drop-shadow-sm">{t('auth.better_pterodactyl')}</h2>
                        <p className="text-sm font-medium text-brand-300 uppercase tracking-widest mt-1">{t('auth.tagline')}</p>
                    </div>

                </div>

                {/* Center / Bottom Inspirational Typography */}
                <div className="relative z-10 max-w-lg mb-12">
                    <h1 className="text-5xl lg:text-7xl font-bold text-white tracking-tighter leading-[1.05] drop-shadow-md">
                        {t('auth.intuitive')}<br />
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-300 to-indigo-400">{t('auth.convenient')}</span><br />
                        {t('auth.efficient')}
                    </h1>

                    <p className="mt-8 text-neutral-300 text-lg leading-relaxed font-normal opacity-90 max-w-sm">
                        {t('auth.description')}
                    </p>

                </div>
            </div>

            {/* Right Form Pane */}
            <div className="w-full lg:w-1/2 flex flex-col justify-center items-center relative z-10 p-6 sm:p-12 lg:p-24 bg-white dark:bg-[#0f172a] transition-colors duration-500 shadow-[-10px_0_30px_rgba(0,0,0,0.02)] dark:shadow-[-20px_0_40px_rgba(0,0,0,0.3)]">

                {/* Mobile Logo Only (Visible when Left Pane is hidden) */}
                <div className="lg:hidden flex flex-col items-center mb-10 w-full max-w-md">
                    <div className="p-4 bg-neutral-100 dark:bg-neutral-800/50 rounded-3xl shadow-sm border border-neutral-200 dark:border-neutral-800 mb-6">
                        <img src={'/assets/svgs/pterodactyl.svg'} className="w-16 h-16 drop-shadow-sm" alt="Logo" />
                    </div>
                    <h2 className="text-3xl font-black text-neutral-900 dark:text-white tracking-tight">{t('auth.welcome_back')}</h2>
                </div>

                {/* Form Container */}
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
    );
};
