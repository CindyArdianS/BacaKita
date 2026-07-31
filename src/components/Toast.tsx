"use client";

import { useEffect, useState } from "react";
import { CheckCircle2, AlertTriangle, Info, XCircle, X } from "lucide-react";
import styles from "./Toast.module.css";

export type ToastType = "success" | "warning" | "info" | "error";

export type ToastData = {
  id: string;
  message: string;
  type: ToastType;
  duration?: number;
};

type Props = {
  toasts: ToastData[];
  onRemove: (id: string) => void;
};

const icons = {
  success: CheckCircle2,
  warning: AlertTriangle,
  info: Info,
  error: XCircle,
};

export default function Toast({ toasts, onRemove }: Props) {
  return (
    <div className={styles.toastContainer} aria-live="polite">
      {toasts.map((toast) => {
        const Icon = icons[toast.type];
        return (
          <ToastItem
            key={toast.id}
            toast={toast}
            onRemove={onRemove}
            Icon={Icon}
          />
        );
      })}
    </div>
  );
}

function ToastItem({
  toast,
  onRemove,
  Icon,
}: {
  toast: ToastData;
  onRemove: (id: string) => void;
  Icon: React.ElementType;
}) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    // Animate in
    const showTimer = setTimeout(() => setVisible(true), 10);

    // Auto-dismiss
    const duration = toast.duration ?? 4000;
    const dismissTimer = setTimeout(() => {
      setVisible(false);
      setTimeout(() => onRemove(toast.id), 350);
    }, duration);

    return () => {
      clearTimeout(showTimer);
      clearTimeout(dismissTimer);
    };
  }, [toast, onRemove]);

  const handleClose = () => {
    setVisible(false);
    setTimeout(() => onRemove(toast.id), 350);
  };

  return (
    <div
      className={`${styles.toast} ${styles[toast.type]} ${visible ? styles.visible : ""}`}
    >
      <div className={styles.toastIcon}>
        <Icon size={20} />
      </div>
      <span className={styles.toastMessage}>{toast.message}</span>
      <button className={styles.toastClose} onClick={handleClose} aria-label="Tutup">
        <X size={16} />
      </button>
    </div>
  );
}
