"use client";

export type ToastMessage = {
  id: number;
  message: string;
  tone?: "success" | "error";
};

export default function ToastHost({ toasts }: { toasts: ToastMessage[] }) {
  return (
    <div className="toast-host" aria-live="polite" aria-atomic="true">
      {toasts.map((toast) => (
        <div
          className={`toast toast-${toast.tone ?? "success"}`}
          key={toast.id}
        >
          {toast.message}
        </div>
      ))}
    </div>
  );
}
