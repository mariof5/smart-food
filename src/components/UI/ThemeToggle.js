import React from 'react';
import { useTheme } from '../../context/ThemeContext';

const ThemeToggle = ({ className = '', size = 'md' }) => {
  const { isDarkMode, toggleTheme } = useTheme();

  const sizeClasses = {
    sm: 'btn-sm',
    md: '',
    lg: 'btn-lg'
  };

  return (
    <button
      className={`btn btn-outline-secondary theme-toggle ${sizeClasses[size]} ${className}`}
      onClick={toggleTheme}
      title={`Switch to ${isDarkMode ? 'light' : 'dark'} mode`}
      aria-label={`Switch to ${isDarkMode ? 'light' : 'dark'} mode`}
    >
      <i className={`fas fa-${isDarkMode ? 'sun' : 'moon'} theme-icon`}></i>
      <span className="theme-text ms-2 d-none d-md-inline">
        {isDarkMode ? 'Light' : 'Dark'}
      </span>
    </button>
  );
};

export default ThemeToggle;