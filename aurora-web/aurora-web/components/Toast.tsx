'use client';

import { useEffect } from 'react';
import { motion } from 'framer-motion';
import { X } from 'lucide-react';

interface ToastProps {
  message: string;
  type: 'success' | 'error' | 'warning';
  onClose: () => void;
}

export default function Toast({ message, type, onClose }: ToastProps) {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, 5000); // 5 seconds

    return () => clearTimeout(timer);
  }, []); // Empty dependency array - only run once on mount

  const bgColor = type === 'success' ? 'bg-green-500' : type === 'warning' ? 'bg-yellow-500' : 'bg-red-500';
  const icon = type === 'success' ? '✅' : type === 'warning' ? '⚠️' : '❌';

  return (
    <motion.div
      initial={{ x: 400, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      exit={{ x: 400, opacity: 0 }}
      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
      className={`${bgColor} px-6 py-4 rounded-lg shadow-2xl max-w-md mb-2`}
    >
      <div className="flex items-center gap-3">
        <div className="flex-shrink-0 text-xl">{icon}</div>
        <p className="text-white font-medium flex-1">{message}</p>
        <button
          onClick={onClose}
          className="flex-shrink-0 text-white/80 hover:text-white transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white rounded"
          aria-label="Close"
        >
          <X className="w-5 h-5" />
        </button>
      </div>
    </motion.div>
  );
}
