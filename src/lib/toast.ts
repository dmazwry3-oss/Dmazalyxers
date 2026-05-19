import { useEffect, useState } from "react";

export type ToastKind = "success" | "error" | "info" | "warning";

export type ToastItem = {
  id: string;
  kind: ToastKind;
  title: string;
  message?: string;
  duration?: number;
};

type Listener = (toasts: ToastItem[]) => void;

const listeners = new Set<Listener>();
let toasts: ToastItem[] = [];

function emit() {
  const snapshot = [...toasts];
  listeners.forEach((l) => l(snapshot));
}

function makeId(): string {
  return `t_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 7)}`;
}

export function showToast(input: Omit<ToastItem, "id">): string {
  const id = makeId();
  const item: ToastItem = { id, duration: 4500, ...input };
  toasts = [...toasts, item];
  emit();
  if (item.duration && item.duration > 0) {
    window.setTimeout(() => dismissToast(id), item.duration);
  }
  return id;
}

export function dismissToast(id: string) {
  toasts = toasts.filter((t) => t.id !== id);
  emit();
}

export function clearToasts() {
  toasts = [];
  emit();
}

// Convenience wrappers
export const toast = {
  success: (title: string, message?: string) =>
    showToast({ kind: "success", title, message }),
  error: (title: string, message?: string) =>
    showToast({ kind: "error", title, message, duration: 6000 }),
  info: (title: string, message?: string) =>
    showToast({ kind: "info", title, message }),
  warning: (title: string, message?: string) =>
    showToast({ kind: "warning", title, message }),
};

export function useToasts(): ToastItem[] {
  const [state, setState] = useState<ToastItem[]>(toasts);
  useEffect(() => {
    const listener: Listener = (next) => setState(next);
    listeners.add(listener);
    setState([...toasts]);
    return () => {
      listeners.delete(listener);
    };
  }, []);
  return state;
}
