import { forwardRef, type InputHTMLAttributes, type TextareaHTMLAttributes, type SelectHTMLAttributes, type ReactNode } from 'react';

type CoreInputProps = InputHTMLAttributes<HTMLInputElement>;
type CoreTextAreaProps = TextareaHTMLAttributes<HTMLTextAreaElement>;
type CoreSelectProps = SelectHTMLAttributes<HTMLSelectElement>;

interface BaseProps {
  label?: string;
  error?: string;
  className?: string;
  hideLabel?: boolean;
  wrapperClassName?: string;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
}

interface InputAsInputProps extends BaseProps, Omit<CoreInputProps, 'className'> {
  as?: 'input';
}

interface InputAsTextAreaProps extends BaseProps, Omit<CoreTextAreaProps, 'className'> {
  as: 'textarea';
}

interface InputAsSelectProps extends BaseProps, Omit<CoreSelectProps, 'className'> {
  as: 'select';
  children: ReactNode; // Select specifically needs children for options
}

export type InputProps = InputAsInputProps | InputAsTextAreaProps | InputAsSelectProps;

export const Input = forwardRef<
  HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement,
  InputProps
>(({ label, error, className = '', as = 'input', hideLabel = false, wrapperClassName = 'w-full', leftIcon, rightIcon, ...props }, ref) => {
  const hasLeftIcon = !!leftIcon;
  const hasRightIcon = !!rightIcon;

  const commonInputClassName = `input ${error ? 'border-red-500 dark:border-red-700 focus:ring-red-500 focus:border-red-500' : 'border-gray-300 dark:border-gray-600 focus:border-blue-500 dark:focus:border-blue-400 focus:ring-blue-500'} ${hasLeftIcon ? 'pl-10' : ''} ${hasRightIcon ? 'pr-10' : ''} ${className}`;

  const renderInput = () => {
    switch (as) {
      case 'textarea':
        return (
          <textarea
            ref={ref as React.ForwardedRef<HTMLTextAreaElement>}
            className={commonInputClassName}
            {...(props as CoreTextAreaProps)}
          />
        );
      case 'select':
        return (
          <select
            ref={ref as React.ForwardedRef<HTMLSelectElement>}
            className={commonInputClassName}
            {...(props as CoreSelectProps)}
          >
            {(props as InputAsSelectProps).children}
          </select>
        );
      case 'input':
      default:
        return (
          <input
            ref={ref as React.ForwardedRef<HTMLInputElement>}
            className={commonInputClassName}
            {...(props as CoreInputProps)}
          />
        );
    }
  };

  return (
    <div className={wrapperClassName}>
      {!hideLabel && label && (
        <label
          htmlFor={props.id}
          className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
        >
          {label}
        </label>
      )}
      <div className="relative">
        {hasLeftIcon && (
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            {leftIcon}
          </div>
        )}
        {renderInput()}
        {hasRightIcon && (
          <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
            {/* For rightIcon, if it's interactive (e.g., clear button), pointer-events-none might need to be conditional or removed */}
            {rightIcon}
          </div>
        )}
      </div>
      {error && (
        <p className="mt-1 text-xs text-red-500 dark:text-red-400">{error}</p>
      )}
    </div>
  );
}); 