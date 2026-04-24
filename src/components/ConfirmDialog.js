import React, { useEffect, useRef } from 'react';
import './ConfirmDialog.css';

function ConfirmDialog({ title, message, confirmLabel = 'Confirm', danger = true, onConfirm, onCancel }) {
  const confirmButtonRef = useRef(null);

  useEffect(() => {
    // Focus confirm button immediately for instant interaction
    if (confirmButtonRef.current) {
      confirmButtonRef.current.focus();
    }

    const handler = (e) => {
      if (e.key === 'Enter') { 
        e.preventDefault(); 
        onConfirm(); 
      }
      if (e.key === 'Escape') { 
        e.preventDefault(); 
        onCancel(); 
      }
    };
    
    // Use passive listener for better performance
    window.addEventListener('keydown', handler, { passive: false });
    return () => window.removeEventListener('keydown', handler);
  }, [onConfirm, onCancel]);

  return (
    <div className="dialog-backdrop" onMouseDown={onCancel}>
      <div className="dialog-box" onMouseDown={(e) => e.stopPropagation()}>
        <div className="dialog-icon">{danger ? '🗑️' : '❓'}</div>
        {title && <div className="dialog-title">{title}</div>}
        <div className="dialog-message">{message}</div>
        <div className="dialog-actions">
          <button className="btn btn-secondary" onClick={onCancel}>Cancel</button>
          <button 
            ref={confirmButtonRef}
            className={`btn ${danger ? 'btn-danger' : 'btn-primary'}`} 
            onClick={onConfirm}
          >
            {confirmLabel}
          </button>
        </div>
        <div className="dialog-hint">Enter · Esc</div>
      </div>
    </div>
  );
}

export default ConfirmDialog;
