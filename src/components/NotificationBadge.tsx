'use client';

import { motion } from 'motion/react';

interface NotificationBadgeProps {
  count: number;
  variant?: 'error' | 'warning' | 'success' | 'default';
  size?: 'sm' | 'md';
  pulse?: boolean;
}

export function NotificationBadge({
  count,
  variant = 'default',
  size = 'md',
  pulse = false
}: NotificationBadgeProps) {
  if (count === 0) return null;

  const variantStyles = {
    error: {
      bg: 'var(--error)',
      shadow: '0 0 12px rgba(239, 68, 68, 0.4)',
    },
    warning: {
      bg: 'var(--warning)',
      shadow: '0 0 12px rgba(251, 191, 36, 0.4)',
    },
    success: {
      bg: 'var(--success)',
      shadow: '0 0 12px rgba(34, 197, 94, 0.4)',
    },
    default: {
      bg: 'var(--accent)',
      shadow: '0 0 12px var(--accent-glow)',
    },
  };

  const sizeStyles = {
    sm: {
      minWidth: '16px',
      height: '16px',
      padding: '0 4px',
      fontSize: '9px',
    },
    md: {
      minWidth: '20px',
      height: '20px',
      padding: '0 6px',
      fontSize: '10px',
    },
  };

  const style = variantStyles[variant];
  const sizeStyle = sizeStyles[size];

  return (
    <motion.div
      initial={{ scale: 0 }}
      animate={{ scale: 1 }}
      className={`flex items-center justify-center font-mono font-bold rounded-full text-[var(--bg)] ${pulse ? 'animate-pulse' : ''}`}
      style={{
        ...sizeStyle,
        background: style.bg,
        boxShadow: style.shadow,
      }}
    >
      {count > 99 ? '99+' : count}
    </motion.div>
  );
}
