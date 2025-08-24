import React, { createContext, useContext, useState, useEffect } from 'react';

const ThemeContext = createContext();

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

export const ThemeProvider = ({ children }) => {
  const [isDark, setIsDark] = useState(() => {
    const savedTheme = localStorage.getItem('chat-theme');
    return savedTheme === 'dark';
  });

  const toggleTheme = () => {
    setIsDark(prev => !prev);
  };

  useEffect(() => {
    const theme = isDark ? 'dark' : 'light';
    localStorage.setItem('chat-theme', theme);
    document.documentElement.setAttribute('data-theme', theme);
  }, [isDark]);

  const value = {
    theme: { isDark },
    toggleTheme,
    isDark
  };

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
};
