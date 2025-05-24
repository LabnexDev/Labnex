import React from 'react';
import type { ReactNode } from 'react';
import { XMarkIcon } from '@heroicons/react/24/outline';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
  footer?: ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl'; // Modal width
}

export const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  children,
  footer,
  size = 'md',
}) => {
  if (!isOpen) return null;

  const sizeClasses = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-xl',
  };

  // Determine if header should be rendered (if title exists or onClose is provided for the button)
  const shouldRenderHeader = title !== undefined || onClose !== undefined;

  return (
    <div 
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 
                 bg-black/30 dark:bg-black/50 glassmorphic transition-opacity duration-300 ease-in-out"
      onClick={onClose} // Close on overlay click
    >
      <div 
        className={`relative w-full ${sizeClasses[size]} rounded-xl shadow-2xl 
                   bg-white dark:bg-gradient-to-br dark:from-gray-800 dark:to-gray-900 
                   border border-gray-200 dark:border-gray-700/50 
                   flex flex-col max-h-[90vh] transition-all duration-300 ease-in-out transform scale-95 opacity-0 animate-modal-appear`}
        onClick={(e) => e.stopPropagation()} // Prevent closing when clicking inside modal content
      >
        {/* Header */}
        {shouldRenderHeader && (
          <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700/50">
            {title && <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{title}</h3>}
            {/* Ensure close button is only rendered if onClose is provided */}
            {onClose && (
                <button
                    onClick={onClose}
                    className="p-1 rounded-full text-gray-400 dark:text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700/50 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
                    aria-label="Close modal"
                >
                    <XMarkIcon className="h-6 w-6" />
                </button>
            )}
          </div>
        )}

        {/* Content */}
        <div className="p-6 overflow-y-auto flex-grow">
          {children}
        </div>

        {/* Footer */}
        {footer && (
          <div className="flex items-center justify-end p-4 bg-gray-50 dark:bg-gray-800/50 border-t border-gray-200 dark:border-gray-700/50 rounded-b-xl space-x-3">
            {/* Added background to footer for better separation and rounded bottom corners */} 
            {footer}
          </div>
        )}
      </div>
    </div>
  );
};

// Add a simple appear animation for the modal to index.css or a global style sheet
// @keyframes modal-appear {
//   to {
//     opacity: 1;
//     transform: scale(1);
//   }
// }
// .animate-modal-appear {
//   animation: modal-appear 0.3s forwards;
// } 