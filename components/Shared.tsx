
import React from 'react';

export const Button: React.FC<React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: 'primary' | 'secondary' | 'danger' | 'ghost' }> = ({ 
  className = '', 
  variant = 'primary', 
  ...props 
}) => {
  const baseStyle = "px-4 py-2 rounded-lg font-medium transition-all duration-200 flex items-center justify-center gap-2";
  const variants = {
    primary: "bg-guild-600 hover:bg-guild-700 text-white shadow-md shadow-guild-200 dark:shadow-none",
    secondary: "bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 hover:border-guild-300 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-700 dark:hover:border-slate-600",
    danger: "bg-red-50 text-red-600 hover:bg-red-100 border border-red-100 dark:bg-red-900/20 dark:text-red-400 dark:border-red-900/50 dark:hover:bg-red-900/40",
    ghost: "bg-transparent text-slate-500 hover:text-guild-600 hover:bg-guild-50 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-guild-400"
  };

  return (
    <button className={`${baseStyle} ${variants[variant]} ${className}`} {...props} />
  );
};

export const Badge: React.FC<{ children: React.ReactNode; className?: string; style?: React.CSSProperties }> = ({ children, className = '', style }) => (
  <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold uppercase tracking-wide ${className}`} style={style}>
    {children}
  </span>
);

export const Card: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className = '' }) => (
  <div className={`bg-white rounded-xl border border-slate-200 shadow-sm dark:bg-slate-900 dark:border-slate-800 ${className}`}>
    {children}
  </div>
);

export const Input: React.FC<React.InputHTMLAttributes<HTMLInputElement>> = ({ className = '', ...props }) => (
  <input 
    className={`w-full px-4 py-2 rounded-lg border border-slate-200 bg-white text-slate-900 focus:border-guild-500 focus:ring-2 focus:ring-guild-200 outline-none transition-all dark:bg-white dark:border-slate-200 dark:text-slate-900 ${className}`}
    {...props} 
  />
);
