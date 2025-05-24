import React, { Fragment, type ReactNode } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { XMarkIcon } from '@heroicons/react/24/outline';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl'; // Optional size prop
}

export const Modal: React.FC<ModalProps> = ({ 
    isOpen, 
    onClose, 
    title, 
    children, 
    size = 'md' 
}) => {
    const sizeClasses = {
        sm: 'max-w-sm',
        md: 'max-w-md',
        lg: 'max-w-lg',
        xl: 'max-w-xl',
    };

  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={onClose}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black/70 backdrop-blur-sm" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4 text-center">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <Dialog.Panel 
                className={`w-full ${sizeClasses[size]} transform overflow-hidden rounded-2xl bg-gray-800/80 dark:bg-gray-800/90 border border-purple-500/30 p-6 text-left align-middle shadow-xl transition-all glassmorphism-strong text-white`}
              >
                {title && (
                  <Dialog.Title
                    as="h3"
                    className="text-xl font-semibold leading-6 mb-4 flex justify-between items-center"
                  >
                    {title}
                    <button
                        type="button"
                        className="text-gray-400 hover:text-purple-300 transition-colors p-1 rounded-full focus:outline-none focus-visible:ring-2 focus-visible:ring-purple-500"
                        onClick={onClose}
                    >
                        <XMarkIcon className="h-6 w-6" />
                    </button>
                  </Dialog.Title>
                )}
                {!title && (
                     <button
                        type="button"
                        className="absolute top-4 right-4 text-gray-400 hover:text-purple-300 transition-colors p-1 rounded-full focus:outline-none focus-visible:ring-2 focus-visible:ring-purple-500"
                        onClick={onClose}
                    >
                        <XMarkIcon className="h-6 w-6" />
                    </button>
                )}
                <div>{children}</div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
}; 