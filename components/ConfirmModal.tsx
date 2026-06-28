"use client";

import { useEffect } from "react";
import { AlertTriangle, Loader2, X } from "lucide-react";

type ConfirmModalProps = {
  open: boolean;
  title: string;
  message: string;
  confirmLabel: string;
  loading?: boolean;
  onCancel: () => void;
  onConfirm: () => void;
};

export default function ConfirmModal({
  open,
  title,
  message,
  confirmLabel,
  loading = false,
  onCancel,
  onConfirm
}: ConfirmModalProps) {
  useEffect(() => {
    if (!open) {
      return;
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onCancel();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onCancel, open]);

  if (!open) {
    return null;
  }

  return (
    <div className="modal-backdrop" role="presentation">
      <section
        aria-labelledby="confirm-title"
        aria-modal="true"
        className="modal-card confirm-card"
        role="dialog"
      >
        <button
          aria-label="닫기"
          className="icon-button modal-close"
          onClick={onCancel}
          type="button"
        >
          <X size={18} />
        </button>
        <div className="confirm-icon" aria-hidden="true">
          <AlertTriangle size={22} />
        </div>
        <h2 id="confirm-title">{title}</h2>
        <p>{message}</p>
        <div className="modal-actions">
          <button className="soft-button ghost" onClick={onCancel} type="button">
            취소
          </button>
          <button
            className="soft-button danger"
            disabled={loading}
            onClick={onConfirm}
            type="button"
          >
            {loading ? <Loader2 className="spin" size={16} /> : null}
            {confirmLabel}
          </button>
        </div>
      </section>
    </div>
  );
}
