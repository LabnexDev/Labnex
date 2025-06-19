import React from 'react';
import { Link } from 'react-router-dom';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'tertiary' | 'danger';
  size?: 'sm' | 'md' | 'lg' | 'xl';
  to?: string;
  className?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  isLoading?: boolean;
  fullWidth?: boolean;
  'aria-label'?: string;
  'aria-describedby'?: string;
}

export const Button: React.FC<ButtonProps> = ({ 
  children, 
  className, 
  variant = 'primary', 
  size = 'md', 
  to, 
  leftIcon,
  rightIcon,
  isLoading,
  disabled,
  fullWidth = false,
  'aria-label': ariaLabel,
  'aria-describedby': ariaDescribedBy,
  ...props 
}) => {
  const baseStyle = "font-semibold py-2 px-4 rounded-lg transition-all duration-300 ease-in-out focus:outline-none focus:ring-2 focus:ring-opacity-50 flex items-center justify-center gap-2 relative";
  
  const variantStyles = {
    primary: "text-white bg-gradient-to-r from-brand-600 to-indigo-500 hover:from-brand-500 hover:to-blue-500 focus:ring-brand-500 hover:shadow-glow-brand disabled:hover:from-brand-600 disabled:hover:to-indigo-500",
    secondary: "bg-gray-200 hover:bg-gray-300 text-gray-700 dark:bg-gray-700 dark:hover:bg-gray-600 dark:text-gray-100 focus:ring-gray-500 dark:focus:ring-gray-400 disabled:hover:bg-gray-200 dark:disabled:hover:bg-gray-700",
    tertiary: "bg-transparent hover:bg-gray-200 text-gray-700 dark:text-gray-300 dark:hover:bg-gray-700/40 focus:ring-gray-500 border border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500 disabled:hover:bg-transparent disabled:hover:border-gray-300 dark:disabled:hover:border-gray-600",
    danger: "bg-red-600 hover:bg-red-500 text-white focus:ring-red-500 disabled:hover:bg-red-600",
  };
  
  const sizeStyles = {
    sm: "text-sm py-1 px-3 min-h-[32px]",
    md: "text-md py-2 px-4 min-h-[40px]",
    lg: "text-lg py-3 px-6 min-h-[48px]",
    xl: "text-xl py-4 px-8 min-h-[56px]",
  };

  const combinedClassName = `
    ${baseStyle}
    ${variantStyles[variant]}
    ${sizeStyles[size]}
    ${fullWidth ? 'w-full' : ''}
    ${isLoading ? 'opacity-75 cursor-not-allowed' : ''}
    ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
    ${className || ''}
  `.replace(/\s+/g, ' ').trim();

  const buttonContent = (
    <>
      {isLoading && (
        <svg 
          className="animate-spin h-5 w-5 text-current" 
          xmlns="http://www.w3.org/2000/svg" 
          fill="none" 
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
      )}
      {leftIcon && !isLoading && <span className="inline-flex items-center" aria-hidden="true">{leftIcon}</span>}
      <span className={`${(leftIcon || rightIcon || isLoading) ? 'mx-1' : ''}`}>
        {isLoading ? 'Loading...' : children}
      </span>
      {rightIcon && !isLoading && <span className="inline-flex items-center" aria-hidden="true">{rightIcon}</span>}
    </>
  );

  const commonProps = {
    className: combinedClassName,
    disabled: isLoading || disabled,
    'aria-label': ariaLabel,
    'aria-describedby': ariaDescribedBy,
    'aria-disabled': isLoading || disabled,
    ...props
  };

  if (to) {
    return (
      <Link to={to} className={commonProps.className} aria-label={ariaLabel} aria-describedby={ariaDescribedBy}>
        {buttonContent}
      </Link>
    );
  }

  return (
    <button {...commonProps}>
      {buttonContent}
    </button>
  );
};

// export default Button; // Changed to named export above 