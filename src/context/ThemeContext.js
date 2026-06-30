// 主题上下文 — 深色/浅色切换
import React, { createContext, useContext, useState, useEffect } from 'react';
import { themes } from '../constants/theme';
import * as database from '../storage/database';

const ThemeContext = createContext(null);

export function ThemeProvider({ children }) {
  const [mode, setMode] = useState('light');

  useEffect(() => {
    database.getSettings().then(s => {
      setMode(s.themeMode || 'light');
    });
  }, []);

  const toggle = async () => {
    const next = mode === 'dark' ? 'light' : 'dark';
    setMode(next);
    await database.saveSettings({ themeMode: next });
  };

  const c = themes[mode];

  return (
    <ThemeContext.Provider value={{ mode, colors: c, toggle }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used within ThemeProvider');
  return ctx;
}

export default ThemeContext;
