import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { Icon } from '../utils/icons.jsx';

const ModalContext = createContext(null);

export function useModal() {
  const ctx = useContext(ModalContext);
  if (!ctx) throw new Error('useModal must be used within <ModalProvider>');
  return ctx;
}

export function ModalProvider({ children }) {
  const [content, setContent] = useState(null);
  const [open, setOpen] = useState(false);

  const openModal = useCallback((node) => {
    setContent(node);
    setOpen(true);
  }, []);
  const closeModal = useCallback(() => setOpen(false), []);

  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') closeModal(); };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [closeModal]);

  return (
    <ModalContext.Provider value={{ openModal, closeModal }}>
      {children}
      <div
        className={`modal-overlay${open ? ' open' : ''}`}
        id="modal-overlay"
        onClick={(e) => { if (e.target.id === 'modal-overlay') closeModal(); }}
      >
        <div className="modal" id="modal-box">
          {open ? content : null}
        </div>
      </div>
    </ModalContext.Provider>
  );
}

export function ModalHead({ title, subtitle, onClose }) {
  return (
    <div className="modal-head">
      <div>
        <h3>{title}</h3>
        {subtitle ? <div className="small text-muted">{subtitle}</div> : null}
      </div>
      <button className="modal-close" onClick={onClose}><Icon name="close" size={14} /></button>
    </div>
  );
}
