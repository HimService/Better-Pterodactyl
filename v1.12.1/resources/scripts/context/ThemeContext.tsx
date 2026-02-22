import React, { createContext, useContext, useEffect, useState } from 'react';

type Theme = 'light' | 'dark' | 'system';

interface ThemeContextType {
    theme: Theme;
    setTheme: (theme: Theme) => void;
    isDarkMode: boolean;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC = ({ children }) => {
    const [theme, setTheme] = useState<Theme>(() => {
        const stored = localStorage.getItem('pterodactyl-theme');
        return (stored as Theme) || 'system';
    });

    const [isDarkMode, setIsDarkMode] = useState<boolean>(false);

    useEffect(() => {
        localStorage.setItem('pterodactyl-theme', theme);

        const applyTheme = () => {
            if (theme === 'dark') {
                document.documentElement.classList.add('dark');
                setIsDarkMode(true);
            } else if (theme === 'light') {
                document.documentElement.classList.remove('dark');
                setIsDarkMode(false);
            } else {
                const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
                if (systemPrefersDark) {
                    document.documentElement.classList.add('dark');
                    setIsDarkMode(true);
                } else {
                    document.documentElement.classList.remove('dark');
                    setIsDarkMode(false);
                }
            }
        };

        applyTheme();

        if (theme === 'system') {
            const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
            const handleChange = () => applyTheme();
            mediaQuery.addEventListener('change', handleChange);
            return () => mediaQuery.removeEventListener('change', handleChange);
        }
    }, [theme]);

    return (
        <ThemeContext.Provider value={{ theme, setTheme, isDarkMode }}>
            {children}
        </ThemeContext.Provider>
    );
};

export const useTheme = () => {
    const context = useContext(ThemeContext);
    if (!context) {
        throw new Error('useTheme must be used within a ThemeProvider');
    }
    return context;
};
