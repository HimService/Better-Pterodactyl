import React, { useState, useEffect, useCallback } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
    faDownload,
    faSync,
    faCheckCircle,
    faExclamationTriangle,
    faRocket,
    faShieldAlt,
    faHistory,
} from '@fortawesome/free-solid-svg-icons';
import { useTranslation } from 'react-i18next';

interface VersionInfo {
    local: string;
    remote: string;
    updatable: boolean;
    has_backups?: boolean;
}

const UpdateManager = () => {
    const { t } = useTranslation();
    const [info, setInfo] = useState<VersionInfo | null>(null);
    const [loading, setLoading] = useState(true);
    const [updating, setUpdating] = useState(false);
    const [cleaning, setCleaning] = useState(false);
    const [status, setStatus] = useState<string>('');
    const [error, setError] = useState<string | null>(null);

    const checkVersion = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            // Add cache buster to URL
            const response = await fetch(`/admin/update/check?t=${Date.now()}`);
            const data = await response.json();
            setInfo(data);
        } catch (e) {
            console.error(e);
            setError('Failed to fetch version information.');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        checkVersion();
    }, [checkVersion]);

    const handleUpdate = async () => {
        if (!info?.updatable || updating) return;

        (window as any).swal({
            title: '確定要更新嗎？',
            text: '系統將會自動下載並替換檔案，此過程不可逆。請確保您已做好備份。',
            type: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#8b5cf6',
            confirmButtonText: '開始更新',
            cancelButtonText: '取消'
        }, async (confirmed: boolean) => {
            if (!confirmed) return;

            setUpdating(true);
            setStatus('正在下載更新檔案...');
            setError(null);

            try {
                const response = await fetch('/admin/update/execute', {
                    method: 'POST',
                    headers: {
                        'X-CSRF-TOKEN': (document.querySelector('meta[name="_token"]') as any)?.content || ''
                    }
                });

                const data = await response.json();

                if (response.ok && data.success) {
                    setStatus('更新成功！正在後台編譯資源 (yarn build:production)，這可能需要 2-5 分鐘。');
                    (window as any).swal({
                        title: '更新成功',
                        text: '檔案已替換，系統正在後台編譯面板資源。您可以稍後重新整理頁面。',
                        type: 'success'
                    });
                    checkVersion();
                } else {
                    throw new Error(data.error || '更新過程中發生錯誤。');
                }
            } catch (err: any) {
                setError(err.message);
                (window as any).swal({
                    title: '更新失敗',
                    text: err.message,
                    type: 'error'
                });
            } finally {
                setUpdating(false);
            }
        });
    };

    const handleCleanup = async () => {
        if (cleaning) return;

        (window as any).swal({
            title: '確定要清理備份嗎？',
            text: '這將會永久刪除 resources_old 與 routes_old 資料夾。請確保新版本運行正常。',
            type: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#ef4444',
            confirmButtonText: '確定刪除',
            cancelButtonText: '取消'
        }, async (confirmed: boolean) => {
            if (!confirmed) return;

            setCleaning(true);
            try {
                const response = await fetch('/admin/update/cleanup', {
                    method: 'POST',
                    headers: {
                        'X-CSRF-TOKEN': (document.querySelector('meta[name="_token"]') as any)?.content || ''
                    }
                });
                const data = await response.json();
                if (data.success) {
                    // Force UI update locally to prevent perceived "stickiness"
                    setInfo(prev => prev ? { ...prev, has_backups: false } : null);

                    (window as any).swal({
                        title: '清理完畢',
                        text: '備份資料夾已成功刪除。',
                        type: 'success'
                    });
                    checkVersion();
                } else {
                    throw new Error(data.error || '清理時發生錯誤。');
                }
            } catch (err: any) {
                (window as any).swal({
                    title: '清理失敗',
                    text: err.message,
                    type: 'error'
                });
            } finally {
                setCleaning(false);
            }
        });
    };

    return (
        <div className="max-w-[60rem] mx-auto my-8 px-4 animate-[fade-in_0.5s_ease-out]">
            {/* Custom Animation Styles */}
            <style dangerouslySetInnerHTML={{
                __html: `
                @keyframes fade-in {
                    from { opacity: 0; transform: translateY(10px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                @keyframes pulse-custom {
                    0% { transform: scale(1); box-shadow: 0 0 0 0 rgba(139, 92, 246, 0.4); }
                    70% { transform: scale(1.05); box-shadow: 0 0 0 10px rgba(139, 92, 246, 0); }
                    100% { transform: scale(1); box-shadow: 0 0 0 0 rgba(139, 92, 246, 0); }
                }
                .animate-pulse-custom {
                    animation: pulse-custom 2s infinite;
                }
            ` }} />

            <div className="mb-12 text-center">
                <h2 className="text-4xl font-extrabold bg-gradient-to-r from-white to-violet-400 bg-clip-text text-transparent mb-4">
                    版本更新中心
                </h2>
                <p className="text-neutral-400 text-lg">
                    管理您的 Better Pterodactyl 系統版本與更新。
                </p>
            </div>

            <div className="bg-neutral-900/70 backdrop-blur-xl border border-white/10 rounded-[2rem] p-12 shadow-2xl text-center">
                {loading ? (
                    <div className="py-16">
                        <FontAwesomeIcon icon={faSync} spin size="3x" className="text-violet-500" />
                        <p className="mt-8 text-neutral-500">正在檢查版本更新...</p>
                    </div>
                ) : (
                    <>
                        <div className="flex flex-col md:flex-row justify-center items-center gap-12 mb-12">
                            <div className="flex flex-col items-center">
                                <p className="text-neutral-500 text-[10px] uppercase font-black tracking-widest mb-4">目前版本</p>
                                <div className="inline-flex items-center gap-2 px-5 py-2 rounded-full bg-violet-500/10 text-violet-400 border border-violet-500/20 font-mono font-bold text-sm">
                                    <FontAwesomeIcon icon={faHistory} />
                                    {info?.local}
                                </div>
                            </div>
                            <div className="flex flex-col items-center">
                                <p className="text-neutral-500 text-[10px] uppercase font-black tracking-widest mb-4">最新版本</p>
                                <div className="inline-flex items-center gap-2 px-5 py-2 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-mono font-bold text-sm">
                                    <FontAwesomeIcon icon={faRocket} />
                                    {info?.remote}
                                </div>
                            </div>
                        </div>

                        {info?.updatable ? (
                            <>
                                <div className={`w-24 h-24 bg-violet-500/10 rounded-3xl flex items-center justify-center mx-auto mb-8 text-violet-500 text-4xl ${!updating ? 'animate-pulse-custom' : ''}`}>
                                    <FontAwesomeIcon icon={updating ? faDownload : faRocket} />
                                </div>
                                <h3 className="text-white text-2xl font-bold mb-4">發現新版本！</h3>
                                <p className="text-neutral-400 mb-10 max-w-md mx-auto">
                                    建議您立即更新以獲取最新的功能與安全性修復。
                                </p>
                                <button
                                    onClick={handleUpdate}
                                    disabled={updating}
                                    className="px-10 py-4 bg-gradient-to-br from-violet-600 to-indigo-600 hover:brightness-110 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-2xl font-black text-lg shadow-[0_10px_30px_rgba(139,92,246,0.3)] transition-all transform hover:-translate-y-1 active:scale-95 flex items-center gap-3 mx-auto"
                                >
                                    <FontAwesomeIcon icon={updating ? faSync : faDownload} spin={updating} />
                                    {updating ? '正在執行更新...' : '立即下載並更新'}
                                </button>

                                <div className="mt-8 p-6 bg-amber-500/10 border border-amber-500/20 rounded-2xl text-amber-300 text-sm text-left flex gap-4 leading-relaxed">
                                    <FontAwesomeIcon icon={faExclamationTriangle} className="mt-1 flex-shrink-0" />
                                    <div>
                                        <strong className="block mb-1 text-amber-400">重要提示 (Important):</strong>
                                        更新將會備份並替換 <code>resources</code> 與 <code>routes</code> 資料夾。
                                        如果您曾手動修改過這些資料夾內的檔案，您的更改將會丟失。
                                        正在進行中的 <code>yarn build</code> 可能會導致面板短暫無法造訪。
                                    </div>
                                </div>
                            </>
                        ) : error ? (
                            <div className="py-8">
                                <div className="text-red-500 mb-6 font-bold">
                                    <FontAwesomeIcon icon={faExclamationTriangle} size="3x" />
                                </div>
                                <h3 className="text-white text-2xl font-bold mb-4">檢查失敗</h3>
                                <p className="text-neutral-400 mb-8">{error}</p>
                                <button
                                    onClick={checkVersion}
                                    className="px-8 py-3 bg-white/5 hover:bg-white/10 text-white rounded-xl font-bold transition-all border border-white/10"
                                >
                                    重新整理
                                </button>
                            </div>
                        ) : (
                            <div className="py-8">
                                <div className="text-emerald-500 mb-6">
                                    <FontAwesomeIcon icon={faCheckCircle} size="4x" />
                                </div>
                                <h3 className="text-white text-3xl font-black mb-4">您的系統已是最新版</h3>
                                <p className="text-neutral-400">目前沒有可用的更新，請保持關注以獲取未來更新。</p>
                            </div>
                        )}

                        {info?.has_backups && (
                            <div className="mt-12 p-8 bg-black/40 border border-white/5 rounded-[2rem] text-center max-w-lg mx-auto">
                                <h4 className="text-white text-lg font-bold mb-2">備份資料夾偵測</h4>
                                <p className="text-neutral-400 text-sm mb-6">
                                    系統偵測到舊版本的備份資料夾 (routes_old, resources_old)。
                                    確認新版本運行正常後，您可以手動清理它們。
                                </p>
                                <button
                                    onClick={handleCleanup}
                                    disabled={cleaning}
                                    className="px-6 py-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/30 rounded-xl font-bold text-xs transition-all flex items-center gap-2 mx-auto"
                                >
                                    <FontAwesomeIcon icon={cleaning ? faSync : faHistory} spin={cleaning} />
                                    {cleaning ? '正在清理...' : '立即清理舊備份'}
                                </button>
                            </div>
                        )}

                        {status && (
                            <div className="mt-8 bg-black/40 border border-white/5 rounded-2xl p-6 text-left font-mono text-sm overflow-hidden">
                                <div className="flex items-center gap-3 mb-4">
                                    <div className="w-2 h-2 rounded-full bg-violet-500 animate-pulse" />
                                    <span className="text-violet-400 font-black text-xs uppercase tracking-tighter">System Log</span>
                                </div>
                                <div className="text-neutral-400 break-all">{status}</div>
                                {updating && <div className="mt-2 text-neutral-600 animate-pulse">請勿關閉視窗，正在執行系統變更...</div>}
                            </div>
                        )}
                    </>
                )}
            </div>
        </div>
    );
};

export default UpdateManager;
