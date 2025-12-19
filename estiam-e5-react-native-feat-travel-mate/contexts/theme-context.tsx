import { createContext, useContext, useState, ReactNode } from 'react';

type ThemeContextType = {
    isDarkMode: boolean;
    toggleDarkMode: () => void;
};

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProviderCustom({ children }: { children: ReactNode }) {
    const [isDarkMode, setIsDarkMode] = useState(false);

    const toggleDarkMode = () => {
        setIsDarkMode(prev => !prev);
    };

    return (
        <ThemeContext.Provider value={{ isDarkMode, toggleDarkMode }}>
            {children}
        </ThemeContext.Provider>
    );
}

export function useTheme() {
    const context = useContext(ThemeContext);
    if (!context) {
        throw new Error('useTheme must be used within ThemeProviderCustom');
    }
    return context;
}
