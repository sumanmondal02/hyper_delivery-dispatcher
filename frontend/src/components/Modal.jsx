import { useEffect } from 'react';
import { RiCloseLine } from 'react-icons/ri';
import * as S from '../styles/common';

export default function Modal({ open, onClose, title, children, footer, size = 'md' }) {
  useEffect(() => {
    if (open) document.body.style.overflow = 'hidden';
    else document.body.style.overflow = '';
    return () => { document.body.style.overflow = ''; };
  }, [open]);

  if (!open) return null;

  const maxW = { sm: 'max-w-[380px]', md: 'max-w-[520px]', lg: 'max-w-[720px]' }[size];

  return (
    <div className={S.modalOverlay} onClick={onClose}>
      <div className={`${S.modalBox} ${maxW}`} onClick={(e) => e.stopPropagation()}>
        <div className={S.modalHeader}>
          <h3 className={S.modalTitle}>{title}</h3>
          <button onClick={onClose} className={S.modalClose}><RiCloseLine /></button>
        </div>
        <div className={S.modalBody}>{children}</div>
        {footer && <div className={S.modalFooter}>{footer}</div>}
      </div>
    </div>
  );
}

export function ConfirmModal({ open, onClose, onConfirm, title, message, danger = false, loading = false }) {
  if (!open) return null;
  return (
    <div className={S.modalOverlay} onClick={onClose}>
      <div className={S.confirmModal} onClick={(e) => e.stopPropagation()}>
        <p className={S.confirmTitle}>{title}</p>
        <p className={S.confirmBody}>{message}</p>
        <div className="flex gap-3 justify-center">
          <button onClick={onClose} className={S.btnSecondary}>Cancel</button>
          <button onClick={onConfirm} disabled={loading}
            className={danger ? S.btnDanger : S.btnPrimary}>
            {loading ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : 'Confirm'}
          </button>
        </div>
      </div>
    </div>
  );
}