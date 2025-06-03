import React, { createContext, useState, useContext, type ReactNode } from 'react';

export type ModalType = 'waitlist' | 'comingSoon' | 'info' | null;

export interface ModalPayload {
  featureName?: string; // For 'comingSoon' modal
  infoPageType?: 'privacy' | 'terms' | 'support' | 'contact'; // For 'info' modal
  // Add other specific data properties if needed for modals
}

interface ModalContextProps {
  modalType: ModalType;
  modalPayload: ModalPayload | null;
  openModal: (type: ModalType, payload?: ModalPayload) => void;
  closeModal: () => void;
}

const ModalContext = createContext<ModalContextProps | undefined>(undefined);

export const ModalProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [modalType, setModalType] = useState<ModalType>(null);
  const [modalPayload, setModalPayload] = useState<ModalPayload | null>(null);

  const openModal = (type: ModalType, payload: ModalPayload = {}) => {
    console.log('[ModalContext] Opening modal:', type, payload); // For debugging
    setModalType(type);
    setModalPayload(payload);
  };

  const closeModal = () => {
    console.log('[ModalContext] Closing modal:', modalType); // For debugging
    setModalType(null);
    setModalPayload(null);
  };

  return (
    <ModalContext.Provider value={{ modalType, modalPayload, openModal, closeModal }}>
      {children}
    </ModalContext.Provider>
  );
};

export const useModal = () => {
  const context = useContext(ModalContext);
  if (context === undefined) { // Check for undefined explicitly
    throw new Error('useModal must be used within a ModalProvider');
  }
  return context;
}; 