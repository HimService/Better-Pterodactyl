import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

import zh_TW from '../locales/zh.json';
import en from '../locales/en.json';
import ja from '../locales/ja.json';

i18n.use(initReactI18next).init({
    debug: process.env.DEBUG === 'true',
    lng: (window as any).PterodactylUser?.language || 'zh',
    fallbackLng: 'en',
    keySeparator: '.',
    ns: ['translation', 'frontend'],
    defaultNS: 'translation',
    resources: {
        zh_TW: { translation: zh_TW, frontend: zh_TW },
        'zh-TW': { translation: zh_TW, frontend: zh_TW },
        zh: { translation: zh_TW, frontend: zh_TW },
        'en': { translation: en, frontend: en },
        en: { translation: en, frontend: en },
        ja: { translation: ja, frontend: ja },
    },
    interpolation: {
        // Per i18n-react documentation: this is not needed since React is already
        // handling escapes for us.
        escapeValue: false,
    },
});

export default i18n;
