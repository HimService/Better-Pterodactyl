import { useTranslation } from 'react-i18next';
import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faBullhorn, faExclamationTriangle, faInfoCircle, faCheckCircle, faChevronRight, faTimes } from '@fortawesome/free-solid-svg-icons';
import tw from 'twin.macro';

interface Announcement {
    id: string;
    enabled: boolean;
    type: 'info' | 'warning' | 'danger' | 'success';
    message: string;
    link?: string;
    updated_at?: string;
}

const AnnouncementBanner = () => {
    const { t, ready } = useTranslation();
    const [announcements, setAnnouncements] = useState<Announcement[]>([]);

    useEffect(() => {
        fetch('/api/public/announcements?t=' + Date.now())
            .then(res => res.json())
            .then(data => {
                if (Array.isArray(data)) {
                    setAnnouncements(data.filter(a => a.enabled && a.message && a.message.trim().length > 0));
                } else if (data && data.enabled && data.message) {
                    setAnnouncements([data as Announcement]);
                }
            })
            .catch(() => null);
    }, []);

    if (announcements.length === 0) return null;

    const colors = {
        info: { bg: 'bg-indigo-600', icon: faInfoCircle, text: 'text-white' },
        warning: { bg: 'bg-amber-600', icon: faExclamationTriangle, text: 'text-white' },
        danger: { bg: 'bg-rose-600', icon: faExclamationTriangle, text: 'text-white' },
        success: { bg: 'bg-emerald-600', icon: faCheckCircle, text: 'text-white' },
    } as any;

    return (
        <div style={{ position: 'sticky', top: 0, zIndex: 40, width: '100%', display: 'flex', flexDirection: 'column' }}>
            <AnimatePresence>
                {announcements.map((announcement) => {
                    const config = colors[announcement.type] || colors.info;

                    return (
                        <motion.div
                            key={announcement.id || Math.random().toString()}
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.3 }}
                            className={`${config.bg} relative overflow-hidden`}
                        >
                            {/* Subtle gradient overlay for premium feel */}
                            <div className="absolute inset-0 bg-gradient-to-r from-black/0 via-black/10 to-black/0 pointer-events-none" />

                            <div className="max-w-7xl mx-auto px-4 py-2 sm:px-6 lg:px-8 relative z-10 flex items-center justify-between gap-4">
                                <div className="flex items-center gap-3 min-w-0 flex-1">
                                    <FontAwesomeIcon icon={config.icon} className={`${config.text} text-sm opacity-80`} />
                                    <p className={`text-sm font-medium ${config.text} truncate`}>
                                        {announcement.message}
                                    </p>
                                </div>

                                {announcement.link && (
                                    <div className="flex-shrink-0">
                                        <a
                                            href={announcement.link}
                                            target="_blank"
                                            rel="noreferrer"
                                            className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-md bg-white/10 hover:bg-white/20 transition-colors text-xs font-semibold ${config.text}`}
                                        >
                                            {ready ? t('admin.announcements.action_button', '點擊查看') : '點擊查看'}
                                            <FontAwesomeIcon icon={faChevronRight} className="text-[0.6rem]" />
                                        </a>
                                    </div>
                                )}
                            </div>
                        </motion.div>
                    );
                })}
            </AnimatePresence>
        </div>
    );
};

export default AnnouncementBanner;
