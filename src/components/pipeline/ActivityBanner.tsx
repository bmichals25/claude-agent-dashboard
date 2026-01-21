'use client';

import { motion } from 'motion/react';
import { PipelineActivity } from '@/lib/types';
import { Loader2 } from 'lucide-react';

interface ActivityBannerProps {
  activity: PipelineActivity;
}

export function ActivityBanner({ activity }: ActivityBannerProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="liquid-card liquid-card-sm"
      style={{
        background: 'linear-gradient(135deg, var(--accent-muted) 0%, rgba(255, 107, 53, 0.05) 100%)',
        border: '1px solid rgba(255, 107, 53, 0.2)',
      }}
    >
      <div className="flex items-center gap-4">
        {/* Animated spinner */}
        <div className="flex-shrink-0">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
            className="w-8 h-8 rounded-full flex items-center justify-center"
            style={{
              background: 'var(--accent)',
              boxShadow: '0 0 20px var(--accent-glow)',
            }}
          >
            <Loader2 className="w-4 h-4 text-[var(--bg)]" />
          </motion.div>
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-caption text-mono text-upper" style={{ color: 'var(--accent)' }}>
              Working
            </span>
            <span className="text-[var(--text-dim)]">|</span>
            <span className="text-caption text-mono truncate" style={{ color: 'var(--text-secondary)' }}>
              {activity.projectTitle}
            </span>
          </div>
          <div className="flex items-center gap-3 mt-1">
            <span className="text-caption" style={{ color: 'var(--text-main)' }}>
              {activity.currentPhase}
            </span>
            <span className="text-[var(--text-dim)]">-</span>
            <span className="text-caption" style={{ color: 'var(--text-secondary)' }}>
              {activity.currentAgent}
            </span>
          </div>
        </div>

        {/* Progress */}
        <div className="flex-shrink-0 flex items-center gap-3">
          <div
            className="w-24 h-1.5 rounded-full overflow-hidden"
            style={{ background: 'var(--glass-border)' }}
          >
            <motion.div
              className="h-full rounded-full"
              style={{ background: 'var(--accent)' }}
              initial={{ width: 0 }}
              animate={{ width: `${activity.progress}%` }}
              transition={{ duration: 0.5 }}
            />
          </div>
          <span className="text-caption text-mono" style={{ color: 'var(--accent)' }}>
            {activity.progress}%
          </span>
        </div>
      </div>
    </motion.div>
  );
}
