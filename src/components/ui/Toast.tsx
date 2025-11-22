"use client";

import { useEffect, useState } from "react";
import { CheckCircle, X } from "lucide-react";

export type ToastType = "success" | "error" | "info" | "warning";
export type ToastPosition = "left" | "right";

export interface Toast {
  id: string;
  message: string;
  type: ToastType;
  position?: ToastPosition;
  duration?: number;
}

interface ToastProps {
  toast: Toast;
  onClose: (id: string) => void;
}

function ToastItem({ toast, onClose }: ToastProps) {
  useEffect(() => {
    if (toast.duration !== 0) {
      const timer = setTimeout(
        () => onClose(toast.id),
        toast.duration || 4000
      );
      return () => clearTimeout(timer);
    }
  }, [toast, onClose]);

  const bgColor = toast.type === "success"
    ? "bg-green-50 border-green-200"
    : toast.type === "error"
      ? "bg-red-50 border-red-200"
      : toast.type === "warning"
        ? "bg-yellow-50 border-yellow-200"
        : "bg-blue-50 border-blue-200";

  const icon = toast.type === "success" ? (
    <CheckCircle className="w-5 h-5 text-green-600" />
  ) : toast.type === "error" ? (
    <X className="w-5 h-5 text-red-600" />
  ) : null;

  const textColor = toast.type === "success"
    ? "text-green-800"
    : toast.type === "error"
      ? "text-red-800"
      : toast.type === "warning"
        ? "text-yellow-800"
        : "text-blue-800";

  return (
    <div
      className={`animate-in ${
        (toast.position || "left") === "left"
          ? "slide-in-from-left-full"
          : "slide-in-from-right-full"
      } duration-300 ${bgColor} border rounded-lg shadow-lg p-4 flex items-center gap-3 min-w-80`}
    >
      {icon}
      <p className={`font-medium text-sm ${textColor}`}>{toast.message}</p>
      <button
        onClick={() => onClose(toast.id)}
        className="ml-auto text-gray-400 hover:text-gray-600"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
}

export function ToastContainer() {
  const [toasts, setToasts] = useState<Toast[]>([]);

  useEffect(() => {
    const handleToast = (event: CustomEvent) => {
      const newToast: Toast = {
        id: Date.now().toString(),
        ...event.detail,
      };
      setToasts((prev) => [...prev, newToast]);
    };

    window.addEventListener("showToast", handleToast as EventListener);
    return () =>
      window.removeEventListener("showToast", handleToast as EventListener);
  }, []);

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  };

  const leftToasts = toasts.filter((t) => (t.position || "left") === "left");
  const rightToasts = toasts.filter((t) => t.position === "right");

  return (
    <>
      <div className="fixed left-4 top-4 z-50 flex flex-col gap-3 pointer-events-none">
        {leftToasts.map((toast) => (
          <div key={toast.id} className="pointer-events-auto">
            <ToastItem toast={toast} onClose={removeToast} />
          </div>
        ))}
      </div>
      <div className="fixed right-4 top-4 z-50 flex flex-col gap-3 pointer-events-none">
        {rightToasts.map((toast) => (
          <div key={toast.id} className="pointer-events-auto">
            <ToastItem toast={toast} onClose={removeToast} />
          </div>
        ))}
      </div>
    </>
  );
}

export function showToast(message: string, type: ToastType = "success", position: ToastPosition = "left", duration?: number) {
  const event = new CustomEvent("showToast", {
    detail: { message, type, position, duration },
  });
  window.dispatchEvent(event);
}
