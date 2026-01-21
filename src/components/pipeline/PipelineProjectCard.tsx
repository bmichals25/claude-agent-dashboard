'use client';

import { motion } from 'motion/react';
import { PipelineProject, STAGES, PIPELINE_STATUS_COLORS, PIPELINE_PRIORITY_COLORS } from '@/lib/types';
import { StageIcon } from './StageIcon';
import { AlertTriangle } from 'lucide-react';

interface PipelineProjectCardProps {
  project: PipelineProject;
  onClick: () => void;
}

export function PipelineProjectCard({ project, onClick }: PipelineProjectCardProps) {
  const currentStage = STAGES[project.stageIndex];
  const progressPercent = Math.round((project.stageIndex / (STAGES.length - 1)) * 100);

  return (
    <motion.button
      onClick={onClick}
      className="w-full text-left group"
      whileHover={{ scale: 1.02, y: -2 }}
      whileTap={{ scale: 0.98 }}
    >
      <div
        className="liquid-card h-full transition-all duration-200"
        style={{
          borderColor: project.status === 'Blocked'
            ? 'rgba(239, 68, 68, 0.3)'
            : 'var(--glass-border)',
        }}
      >
        {/* Header */}
        <div className="flex items-start justify-between gap-3 mb-4">
          {/* Stage Icon */}
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
            style={{
              background: project.status === 'Blocked'
                ? 'rgba(239, 68, 68, 0.15)'
                : project.status === 'Complete'
                ? 'rgba(34, 197, 94, 0.15)'
                : 'var(--accent-muted)',
              border: `1px solid ${
                project.status === 'Blocked'
                  ? 'rgba(239, 68, 68, 0.3)'
                  : project.status === 'Complete'
                  ? 'rgba(34, 197, 94, 0.3)'
                  : 'rgba(255, 107, 53, 0.2)'
              }`,
            }}
          >
            <StageIcon
              name={currentStage?.icon || 'inbox'}
              className="w-5 h-5"
              style={{
                color: project.status === 'Blocked'
                  ? 'var(--error)'
                  : project.status === 'Complete'
                  ? 'var(--success)'
                  : 'var(--accent)',
              }}
            />
          </div>

          {/* Priority & Status */}
          <div className="flex items-center gap-2">
            {/* Priority dot */}
            <div
              className="w-2 h-2 rounded-full"
              style={{
                background: project.priority === 'Critical'
                  ? 'var(--error)'
                  : project.priority === 'High'
                  ? 'var(--accent)'
                  : project.priority === 'Medium'
                  ? 'var(--warning)'
                  : 'var(--text-dim)',
              }}
            />
            {/* Status badge */}
            <span
              className={`badge text-[10px] ${PIPELINE_STATUS_COLORS[project.status]} text-white`}
              style={{ border: 'none' }}
            >
              {project.status}
            </span>
          </div>
        </div>

        {/* Title */}
        <h3
          className="heading-sm truncate mb-1 group-hover:text-[var(--accent)] transition-colors"
        >
          {project.title}
        </h3>

        {/* Current Stage */}
        <p className="text-caption truncate mb-4" style={{ color: 'var(--text-dim)' }}>
          {project.stage} - {project.agent}
        </p>

        {/* Progress Bar */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-caption text-mono">
            <span style={{ color: 'var(--text-muted)' }}>Progress</span>
            <span style={{ color: 'var(--text-secondary)' }}>{progressPercent}%</span>
          </div>
          <div
            className="h-1.5 rounded-full overflow-hidden"
            style={{ background: 'var(--glass-border)' }}
          >
            <motion.div
              className="h-full rounded-full"
              style={{
                background: project.status === 'Blocked'
                  ? 'var(--error)'
                  : project.status === 'Complete'
                  ? 'var(--success)'
                  : 'var(--accent)',
              }}
              initial={{ width: 0 }}
              animate={{ width: `${progressPercent}%` }}
              transition={{ duration: 0.5, delay: 0.1 }}
            />
          </div>
        </div>

        {/* Blocker Warning */}
        {project.blockers && (
          <div
            className="mt-3 flex items-center gap-2 p-2 rounded-lg"
            style={{
              background: 'rgba(239, 68, 68, 0.1)',
              border: '1px solid rgba(239, 68, 68, 0.2)',
            }}
          >
            <AlertTriangle className="w-3.5 h-3.5 text-[var(--error)] flex-shrink-0" />
            <span className="text-[10px] truncate" style={{ color: 'var(--error)' }}>
              {project.blockers}
            </span>
          </div>
        )}
      </div>
    </motion.button>
  );
}
