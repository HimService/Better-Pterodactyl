import { useEffect } from 'react';
import { useStoreState } from 'easy-peasy';

const ThemeManager = () => {
    const isDarkMode = useStoreState((state: any) => state.settings.isDarkMode);

    useEffect(() => {
        if (isDarkMode) {
            document.documentElement.classList.add('dark');
        } else {
            document.documentElement.classList.remove('dark');
        }
    }, [isDarkMode]);

    return null;
};

export default ThemeManager;