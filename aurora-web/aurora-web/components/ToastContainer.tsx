'use client';

import { AnimatePresence } from 'framer-motion';
import Toast from './Toast';

interface ToastData {
  id: number;
  message: string;
  type: 'success' | 'error' | 'warning';
}

interface ToastContainerProps {
  toasts: ToastData[];
  onRemove: (id: number) => void;
}

export default function ToastContainer({ toasts, onRemove }: ToastContainerProps) {
  return (
    <div className="fixed bottom-0 right-0 p-4 space-y-2 z-[9999]">
      <AnimatePresence>
        {toasts.map((toast) => (
          <Toast
            key={toast.id}
            message={toast.message}
            type={toast.type}
            onClose={() => onRemove(toast.id)}
          />
        ))}
      </AnimatePresence>
    </div>
  );
}
