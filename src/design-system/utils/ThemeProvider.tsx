import React, { createContext, useContext, useState, useEffect } from 'react';
import { lightTheme, darkTheme } from '../tokens/colors';

export type Theme = 'light' | 'dark';

interface ThemeContextType {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  isDark: boolean;
  colors: any;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: React.ReactNode; initialTheme?: Theme }> = ({
  children,
  initialTheme = 'light',
}) => {
  const [theme, setThemeState] = useState<Theme>(initialTheme);

  // Detect system preference on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      const storedTheme = localStorage.getItem('theme') as Theme | null;

      if (storedTheme) {
        setThemeState(storedTheme);
      } else if (prefersDark) {
        setThemeState('dark');
      }
    }
  }, []);

  const setTheme = (newTheme: Theme) => {
    setThemeState(newTheme);
    if (typeof window !== 'undefined') {
      localStorage.setItem('theme', newTheme);
      // Update document theme
      document.documentElement.setAttribute('data-theme', newTheme);
    }
  };

  const isDark = theme === 'dark';
  const themeColors = isDark ? darkTheme.colors : lightTheme.colors;

  // Apply theme to document
  useEffect(() => {
    if (typeof document !== 'undefined') {
      document.documentElement.setAttribute('data-theme', theme);
      document.documentElement.style.colorScheme = theme;
    }
  }, [theme]);

  return (
    <ThemeContext.Provider
      value={{
        theme,
        setTheme,
        isDark,
        colors: themeColors,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = (): ThemeContextType => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within ThemeProvider');
  }
  return context;
};

export default ThemeProvider;
