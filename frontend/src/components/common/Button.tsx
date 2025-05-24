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
  ...props 
}) => {
  const baseStyle = "font-semibold py-2 px-4 rounded-lg transition-all duration-300 ease-in-out focus:outline-none focus:ring-2 focus:ring-opacity-50 flex items-center justify-center gap-2";
  
  const variantStyles = {
    primary: "bg-blue-600 hover:bg-blue-500 text-white focus:ring-blue-500",
    secondary: "bg-gray-600 hover:bg-gray-500 text-white focus:ring-gray-500",
    tertiary: "bg-transparent hover:bg-gray-700/50 text-slate-300 hover:text-white focus:ring-gray-500 border border-gray-600 hover:border-gray-500",
    danger: "bg-red-600 hover:bg-red-500 text-white focus:ring-red-500",
  };
  
  const sizeStyles = {
    sm: "text-sm py-1 px-3",
    md: "text-md py-2 px-4",
    lg: "text-lg py-3 px-6",
    xl: "text-xl py-4 px-8",
  };

  const combinedClassName = `
    ${baseStyle}
    ${variantStyles[variant]}
    ${sizeStyles[size]}
    ${isLoading ? 'opacity-75 cursor-not-allowed' : ''}
    ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
    ${className || ''}
  `;

  const buttonContent = (
    <>
      {isLoading && (
        <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
      )}
      {leftIcon && !isLoading && <span className="inline-flex items-center">{leftIcon}</span>}
      <span className={`${(leftIcon || rightIcon || isLoading) ? 'mx-1' : ''}`}>{isLoading ? 'Loading...' : children}</span>
      {rightIcon && !isLoading && <span className="inline-flex items-center">{rightIcon}</span>}
    </>
  );

  if (to) {
    return (
      <Link to={to} className={combinedClassName}>
        {buttonContent}
      </Link>
    );
  }

  return (
    <button className={combinedClassName} disabled={isLoading || disabled} {...props}>
      {buttonContent}
    </button>
  );
};

// export default Button; // Changed to named export above 