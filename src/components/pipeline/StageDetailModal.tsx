'use client';

import { PipelineProject, STAGES } from '@/lib/types';
import { useEffect } from 'react';
import { StageIcon } from './StageIcon';
import { motion, AnimatePresence } from 'motion/react';
import {
  X,
  ExternalLink,
  FileText,
  Github,
  Globe,
  Check,
  Circle,
  CircleDot,
  ArrowRight
} from 'lucide-react';

interface StageDetailModalProps {
  project: PipelineProject;
  stageIndex: number;
  onClose: () => void;
}

export function StageDetailModal({ project, stageIndex, onClose }: StageDetailModalProps) {
  const stage = STAGES[stageIndex];
  const isCompleted = stageIndex < project.stageIndex;
  const isCurrent = stageIndex === project.stageIndex;
  const isFuture = stageIndex > project.stageIndex;

  // Get the deliverable URL for this stage
  const getDeliverableUrl = (): string | null => {
    if (!stage.deliverableKey) return null;
    return project.deliverables[stage.deliverableKey as keyof typeof project.deliverables];
  };

  const deliverableUrl = getDeliverableUrl();

  // Close on escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [onClose]);

  const statusConfig = {
    completed: {
      gradient: 'linear-gradient(135deg, rgba(34, 197, 94, 0.12) 0%, rgba(34, 197, 94, 0.04) 100%)',
      border: 'rgba(34, 197, 94, 0.2)',
      color: '#22c55e',
      label: 'Completed',
      icon: <Check className="w-4 h-4" strokeWidth={2.5} />
    },
    current: {
      gradient: 'linear-gradient(135deg, rgba(255, 107, 53, 0.12) 0%, rgba(255, 107, 53, 0.04) 100%)',
      border: 'rgba(255, 107, 53, 0.2)',
      color: 'var(--accent)',
      label: project.status,
      icon: <CircleDot className="w-4 h-4" />
    },
    future: {
      gradient: 'linear-gradient(135deg, rgba(255, 255, 255, 0.04) 0%, rgba(255, 255, 255, 0.02) 100%)',
      border: 'rgba(255, 255, 255, 0.08)',
      color: 'var(--text-dim)',
      label: 'Pending',
      icon: <Circle className="w-4 h-4" />
    }
  };

  const config = isCompleted ? statusConfig.completed : isCurrent ? statusConfig.current : statusConfig.future;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-6">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0"
          onClick={onClose}
          style={{
            background: 'rgba(0, 0, 0, 0.75)',
            backdropFilter: 'blur(12px)',
          }}
        />

        {/* Modal */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          transition={{ type: 'spring', damping: 30, stiffness: 400 }}
          className="relative w-full max-w-xl"
          style={{
            borderRadius: '24px',
            background: 'linear-gradient(180deg, rgba(18, 18, 22, 0.98) 0%, rgba(12, 12, 14, 0.98) 100%)',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            boxShadow: '0 40px 100px -20px rgba(0, 0, 0, 0.6), 0 0 0 1px rgba(255, 255, 255, 0.02) inset',
            overflow: 'hidden',
          }}
        >
          {/* Ambient glow */}
          <div
            className="absolute top-0 left-1/2 -translate-x-1/2 w-[300px] h-[200px] pointer-events-none"
            style={{
              background: `radial-gradient(ellipse, ${config.color}15 0%, transparent 70%)`,
              transform: 'translate(-50%, -50%)',
            }}
          />

          {/* Header */}
          <div
            className="relative"
            style={{
              padding: '28px 28px 24px',
              background: config.gradient,
              borderBottom: `1px solid ${config.border}`,
            }}
          >
            <div className="flex items-start gap-4">
              {/* Stage Icon */}
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.1 }}
                style={{
                  width: '56px',
                  height: '56px',
                  borderRadius: '16px',
                  background: isCompleted
                    ? 'linear-gradient(135deg, #22c55e 0%, #16a34a 100%)'
                    : isCurrent
                      ? 'linear-gradient(135deg, var(--accent) 0%, var(--accent-secondary) 100%)'
                      : 'rgba(255, 255, 255, 0.06)',
                  border: isCompleted || isCurrent ? 'none' : '1px solid rgba(255, 255, 255, 0.1)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: isCompleted
                    ? '0 8px 24px -4px rgba(34, 197, 94, 0.3)'
                    : isCurrent
                      ? '0 8px 24px -4px rgba(255, 107, 53, 0.3)'
                      : 'none',
                  flexShrink: 0,
                }}
              >
                {isCompleted ? (
                  <Check className="w-6 h-6 text-white" strokeWidth={3} />
                ) : (
                  <StageIcon
                    name={stage.icon}
                    className="w-6 h-6"
                    style={{ color: isCurrent ? 'white' : 'var(--text-secondary)' }}
                  />
                )}
              </motion.div>

              {/* Title & Project */}
              <div className="flex-1 min-w-0">
                <motion.h2
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.15 }}
                  style={{
                    fontSize: '20px',
                    fontWeight: 600,
                    color: 'var(--text-main)',
                    marginBottom: '6px',
                  }}
                >
                  {stage.name}
                </motion.h2>
                <motion.p
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                  style={{
                    fontSize: '13px',
                    color: 'var(--text-dim)',
                  }}
                >
                  {project.title}
                </motion.p>
              </div>

              {/* Close button */}
              <motion.button
                onClick={onClose}
                whileHover={{ scale: 1.05, background: 'rgba(255, 255, 255, 0.08)' }}
                whileTap={{ scale: 0.95 }}
                style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '10px',
                  background: 'rgba(255, 255, 255, 0.04)',
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'var(--text-dim)',
                  cursor: 'pointer',
                }}
              >
                <X className="w-4 h-4" />
              </motion.button>
            </div>

            {/* Status & Agent */}
            <motion.div
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.25 }}
              className="flex items-center gap-3 mt-5"
            >
              <span
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '6px 12px',
                  borderRadius: '8px',
                  fontSize: '12px',
                  fontWeight: 500,
                  background: `${config.color}15`,
                  color: config.color,
                }}
              >
                {config.icon}
                {config.label}
              </span>
              <span style={{ fontSize: '12px', color: 'var(--text-dim)' }}>
                Assigned to <span style={{ color: 'var(--text-secondary)' }}>{stage.agent}</span>
              </span>
            </motion.div>
          </div>

          {/* Content */}
          <div
            className="scrollbar-fade"
            style={{
              padding: '24px 28px',
              maxHeight: '50vh',
              overflowY: 'auto',
            }}
          >
            {/* Description */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              style={{ marginBottom: '24px' }}
            >
              <h3 style={{ fontSize: '11px', color: 'var(--text-dim)', letterSpacing: '0.05em', textTransform: 'uppercase', marginBottom: '10px' }}>
                Stage Description
              </h3>
              <p style={{ fontSize: '14px', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                {stage.description}
              </p>
            </motion.div>

            {/* Deliverable */}
            {stage.deliverableKey && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.35 }}
                style={{ marginBottom: '24px' }}
              >
                <h3 style={{ fontSize: '11px', color: 'var(--text-dim)', letterSpacing: '0.05em', textTransform: 'uppercase', marginBottom: '12px' }}>
                  Deliverable
                </h3>
                {deliverableUrl ? (
                  <motion.a
                    href={deliverableUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    whileHover={{ scale: 1.01, borderColor: '#3b82f6' }}
                    whileTap={{ scale: 0.99 }}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '14px',
                      padding: '16px',
                      borderRadius: '14px',
                      background: 'rgba(59, 130, 246, 0.08)',
                      border: '1px solid rgba(59, 130, 246, 0.15)',
                      textDecoration: 'none',
                      transition: 'all 0.2s ease',
                    }}
                  >
                    <div
                      style={{
                        width: '44px',
                        height: '44px',
                        borderRadius: '12px',
                        background: 'rgba(59, 130, 246, 0.15)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                      }}
                    >
                      <FileText style={{ width: '20px', height: '20px', color: '#3b82f6' }} />
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ fontSize: '14px', fontWeight: 500, color: 'var(--text-main)' }}>
                        View {stage.name.split('. ')[1]} Report
                      </p>
                      <p style={{ fontSize: '12px', color: 'var(--text-dim)', marginTop: '2px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {deliverableUrl}
                      </p>
                    </div>
                    <ArrowRight style={{ width: '18px', height: '18px', color: '#3b82f6', flexShrink: 0 }} />
                  </motion.a>
                ) : (
                  <div
                    style={{
                      padding: '20px',
                      borderRadius: '14px',
                      background: 'rgba(255, 255, 255, 0.02)',
                      border: '1px dashed rgba(255, 255, 255, 0.1)',
                      textAlign: 'center',
                    }}
                  >
                    <p style={{ fontSize: '13px', color: 'var(--text-dim)' }}>
                      {isFuture
                        ? 'Deliverable will be created when this stage begins'
                        : isCurrent
                          ? 'Deliverable in progress...'
                          : 'No deliverable link attached'}
                    </p>
                  </div>
                )}
              </motion.div>
            )}

            {/* Development Stage Links */}
            {stageIndex === 5 && (project.githubUrl || project.deployUrl) && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
              >
                <h3 style={{ fontSize: '11px', color: 'var(--text-dim)', letterSpacing: '0.05em', textTransform: 'uppercase', marginBottom: '12px' }}>
                  Development Artifacts
                </h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {project.githubUrl && (
                    <motion.a
                      href={project.githubUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      whileHover={{ scale: 1.01 }}
                      whileTap={{ scale: 0.99 }}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '14px',
                        padding: '16px',
                        borderRadius: '14px',
                        background: 'rgba(168, 85, 247, 0.08)',
                        border: '1px solid rgba(168, 85, 247, 0.15)',
                        textDecoration: 'none',
                        transition: 'all 0.2s ease',
                      }}
                    >
                      <div
                        style={{
                          width: '44px',
                          height: '44px',
                          borderRadius: '12px',
                          background: 'rgba(168, 85, 247, 0.15)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          flexShrink: 0,
                        }}
                      >
                        <Github style={{ width: '20px', height: '20px', color: '#a855f7' }} />
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <p style={{ fontSize: '14px', fontWeight: 500, color: 'var(--text-main)' }}>
                          GitHub Repository
                        </p>
                        <p style={{ fontSize: '12px', color: 'var(--text-dim)', marginTop: '2px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {project.githubUrl}
                        </p>
                      </div>
                      <ExternalLink style={{ width: '16px', height: '16px', color: 'var(--text-dim)', flexShrink: 0 }} />
                    </motion.a>
                  )}
                  {project.deployUrl && (
                    <motion.a
                      href={project.deployUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      whileHover={{ scale: 1.01 }}
                      whileTap={{ scale: 0.99 }}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '14px',
                        padding: '16px',
                        borderRadius: '14px',
                        background: 'rgba(34, 197, 94, 0.08)',
                        border: '1px solid rgba(34, 197, 94, 0.15)',
                        textDecoration: 'none',
                        transition: 'all 0.2s ease',
                      }}
                    >
                      <div
                        style={{
                          width: '44px',
                          height: '44px',
                          borderRadius: '12px',
                          background: 'rgba(34, 197, 94, 0.15)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          flexShrink: 0,
                        }}
                      >
                        <Globe style={{ width: '20px', height: '20px', color: '#22c55e' }} />
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <p style={{ fontSize: '14px', fontWeight: 500, color: 'var(--text-main)' }}>
                          Live Deployment
                        </p>
                        <p style={{ fontSize: '12px', color: 'var(--text-dim)', marginTop: '2px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {project.deployUrl}
                        </p>
                      </div>
                      <ExternalLink style={{ width: '16px', height: '16px', color: 'var(--text-dim)', flexShrink: 0 }} />
                    </motion.a>
                  )}
                </div>
              </motion.div>
            )}

            {/* Empty state for dev stage */}
            {stageIndex === 5 && !project.githubUrl && !project.deployUrl && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
              >
                <h3 style={{ fontSize: '11px', color: 'var(--text-dim)', letterSpacing: '0.05em', textTransform: 'uppercase', marginBottom: '12px' }}>
                  Development Artifacts
                </h3>
                <div
                  style={{
                    padding: '20px',
                    borderRadius: '14px',
                    background: 'rgba(255, 255, 255, 0.02)',
                    border: '1px dashed rgba(255, 255, 255, 0.1)',
                    textAlign: 'center',
                  }}
                >
                  <p style={{ fontSize: '13px', color: 'var(--text-dim)' }}>
                    No development artifacts yet
                  </p>
                </div>
              </motion.div>
            )}

            {/* Notes */}
            {project.notes && isCurrent && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.45 }}
                style={{ marginTop: '24px' }}
              >
                <h3 style={{ fontSize: '11px', color: 'var(--text-dim)', letterSpacing: '0.05em', textTransform: 'uppercase', marginBottom: '10px' }}>
                  Current Notes
                </h3>
                <p
                  style={{
                    fontSize: '13px',
                    color: 'var(--text-secondary)',
                    lineHeight: 1.6,
                    padding: '16px',
                    borderRadius: '12px',
                    background: 'rgba(255, 255, 255, 0.03)',
                    border: '1px solid rgba(255, 255, 255, 0.06)',
                  }}
                >
                  {project.notes}
                </p>
              </motion.div>
            )}
          </div>

          {/* Footer */}
          <div
            style={{
              padding: '16px 28px',
              borderTop: '1px solid rgba(255, 255, 255, 0.06)',
              background: 'rgba(255, 255, 255, 0.02)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <a
              href={project.url}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                fontSize: '12px',
                color: 'var(--text-dim)',
                textDecoration: 'none',
                transition: 'color 0.2s ease',
              }}
            >
              View full project in Notion
              <ExternalLink style={{ width: '12px', height: '12px' }} />
            </a>
            <motion.button
              onClick={onClose}
              whileHover={{ background: 'rgba(255, 255, 255, 0.08)' }}
              whileTap={{ scale: 0.98 }}
              style={{
                padding: '10px 20px',
                borderRadius: '10px',
                fontSize: '13px',
                fontWeight: 500,
                background: 'rgba(255, 255, 255, 0.04)',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                color: 'var(--text-secondary)',
                cursor: 'pointer',
              }}
            >
              Close
            </motion.button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
