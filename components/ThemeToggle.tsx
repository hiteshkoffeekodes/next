'use client';

import { useState, useEffect, useSyncExternalStore } from 'react';
import { Sun, Moon } from 'lucide-react';

const emptySubscribe = () => () => {};

export function ThemeToggle({ className = '' }: { className?: string }) {
  const isMounted = useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false
  );

  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    if (typeof window === 'undefined') return 'light';
    try {
      const saved = localStorage.getItem('bingo_theme') as 'light' | 'dark' | null;
      return saved || 'light';
    } catch {
      return 'light';
    }
  });

  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [theme]);

  const toggleTheme = () => {
    const nextTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(nextTheme);
    try {
      localStorage.setItem('bingo_theme', nextTheme);
    } catch {
      // Ignore
    }
  };

  if (!isMounted) {
    return (
      <div className={`w-9 h-9 rounded-xl bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 ${className}`} />
    );
  }

  return (
    <button
      onClick={toggleTheme}
      className={`p-2 rounded-xl border transition-all duration-300 active:scale-95 cursor-pointer ${
        theme === 'light'
          ? 'bg-white hover:bg-slate-50 text-amber-500 border-slate-200 shadow-sm hover:shadow'
          : 'bg-slate-900 hover:bg-slate-800 text-indigo-300 border-slate-800'
      } ${className}`}
      title={theme === 'light' ? 'Switch to Dark Theme' : 'Switch to Light Theme'}
      aria-label="Toggle Theme"
    >
      {theme === 'light' ? (
        <Sun className="w-4 h-4 fill-amber-400 text-amber-500 transition-transform duration-300 rotate-0 hover:rotate-45" />
      ) : (
        <Moon className="w-4 h-4 fill-indigo-400 text-indigo-400 transition-transform duration-300 -rotate-12 hover:rotate-0" />
      )}
    </button>
  );
}
