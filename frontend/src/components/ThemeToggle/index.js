import React from 'react';
import { useTheme } from '../../context/ThemeContext';
import './ThemeToggle.css';

function ThemeToggle() {
  const { isDarkMode, toggleTheme } = useTheme();

  return (
    <button 
      className="theme-toggle"
      onClick={toggleTheme}
      aria-label="Toggle theme"
      title={isDarkMode ? "Switch to light mode" : "Switch to dark mode"}
    >
      {isDarkMode ? '☀️' : '🌙'}
    </button>
  );
}

export default ThemeToggle;
