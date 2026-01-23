'use client';

import React, { useEffect, useRef, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import { PipelineProject, STAGES, StreamEntry, Task } from '@/lib/types';
import { StageIcon } from './StageIcon';
import { motion, AnimatePresence } from 'motion/react';
import { useDashboardStore } from '@/lib/store';
import {
  X,
  ExternalLink,
  FileText,
  Github,
  Globe,
  Check,
  Circle,
  CircleDot,
  ArrowRight,
  Brain,
  Zap,
  CheckCircle,
  AlertCircle,
  Loader2,
  Play
} from 'lucide-react';
import { initializePipeline } from '@/lib/executionEngine';

interface StageDetailModalProps {
  project: PipelineProject;
  stageIndex: number;
  onClose: () => void;
}

// Stream entry component with icons and styling
function StreamEntryItem({ entry, isLatest }: { entry: StreamEntry; isLatest: boolean }) {
  const typeConfig = {
    thought: {
      icon: <Brain className="w-3.5 h-3.5" />,
      color: '#a78bfa',
      bgColor: 'rgba(167, 139, 250, 0.1)',
      label: 'Thinking',
    },
    action: {
      icon: <Zap className="w-3.5 h-3.5" />,
      color: '#f59e0b',
      bgColor: 'rgba(245, 158, 11, 0.1)',
      label: 'Action',
    },
    result: {
      icon: <CheckCircle className="w-3.5 h-3.5" />,
      color: '#22c55e',
      bgColor: 'rgba(34, 197, 94, 0.1)',
      label: 'Result',
    },
    error: {
      icon: <AlertCircle className="w-3.5 h-3.5" />,
      color: '#ef4444',
      bgColor: 'rgba(239, 68, 68, 0.1)',
      label: 'Error',
    },
  };

  const config = typeConfig[entry.type];
  const timestamp = new Date(entry.timestamp).toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  });

  return (
    <motion.div
      initial={{ opacity: 0, x: -10, height: 0 }}
      animate={{ opacity: 1, x: 0, height: 'auto' }}
      transition={{ duration: 0.2 }}
      style={{
        display: 'flex',
        gap: '12px',
        padding: '12px 14px',
        borderRadius: '12px',
        background: isLatest ? config.bgColor : 'transparent',
        border: isLatest ? `1px solid ${config.color}20` : '1px solid transparent',
        marginBottom: '8px',
      }}
    >
      {/* Icon */}
      <div
        style={{
          width: '28px',
          height: '28px',
          borderRadius: '8px',
          background: config.bgColor,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: config.color,
          flexShrink: 0,
        }}
      >
        {config.icon}
      </div>

      {/* Content */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
          <span style={{ fontSize: '11px', fontWeight: 600, color: config.color, textTransform: 'uppercase', letterSpacing: '0.03em' }}>
            {config.label}
          </span>
          <span style={{ fontSize: '10px', color: 'var(--text-dim)', fontFamily: 'monospace' }}>
            {timestamp}
          </span>
        </div>
        <div style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: 1.5 }} className="prose prose-sm prose-invert max-w-none">
          {entry.type === 'result' ? (
            <ReactMarkdown>{entry.content}</ReactMarkdown>
          ) : (
            <p style={{ margin: 0 }}>{entry.content}</p>
          )}
        </div>
      </div>

      {/* Live indicator for latest */}
      {isLatest && (
        <div
          style={{
            width: '8px',
            height: '8px',
            borderRadius: '50%',
            background: config.color,
            animation: 'pulse 1.5s ease-in-out infinite',
            flexShrink: 0,
            marginTop: '10px',
          }}
        />
      )}
    </motion.div>
  );
}

// Button to start the pipeline execution
function StartPipelineButton({ projectId }: { projectId: string }) {
  const [isStarting, setIsStarting] = useState(false);
  const { setChatViewMode } = useDashboardStore();

  const handleStart = async () => {
    setIsStarting(true);
    setChatViewMode('activity');
    initializePipeline(projectId);
    // Keep the button in loading state briefly so user sees feedback
    setTimeout(() => setIsStarting(false), 1000);
  };

  return (
    <motion.button
      onClick={handleStart}
      disabled={isStarting}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '8px',
        padding: '12px 24px',
        borderRadius: '12px',
        border: 'none',
        background: 'linear-gradient(135deg, var(--accent) 0%, var(--accent-secondary) 100%)',
        color: 'white',
        fontSize: '13px',
        fontWeight: 600,
        cursor: isStarting ? 'not-allowed' : 'pointer',
        opacity: isStarting ? 0.7 : 1,
        transition: 'opacity 0.2s ease',
      }}
    >
      {isStarting ? (
        <>
          <Loader2 style={{ width: '16px', height: '16px', animation: 'spin 1s linear infinite' }} />
          Starting...
        </>
      ) : (
        <>
          <Play style={{ width: '16px', height: '16px' }} />
          Start Pipeline
        </>
      )}
    </motion.button>
  );
}

export function StageDetailModal({ project, stageIndex, onClose }: StageDetailModalProps) {
  const stage = STAGES[stageIndex];
  const isCompleted = stageIndex < project.stageIndex;
  const isCurrent = stageIndex === project.stageIndex;
  const isFuture = stageIndex > project.stageIndex;

  // Get the pipeline execution and current task from store
  const { getPipelineExecution, tasks } = useDashboardStore();
  const execution = getPipelineExecution(project.id);
  const isExecuting = execution?.status === 'running' || execution?.status === 'paused';

  // Find the current task - first try via execution state, then fallback to finding any in-progress task for this project
  let currentTask = execution?.currentTaskId ? tasks.find(t => t.id === execution.currentTaskId) : null;

  // Fallback: find any in-progress task for this project
  if (!currentTask && isCurrent) {
    currentTask = tasks.find(t =>
      t.projectId === project.id &&
      (t.status === 'in_progress' || t.status === 'pending')
    ) || null;
  }

  // Only show live stream if this is the current stage and there's an active task with stream output
  const showLiveStream = isCurrent && currentTask && currentTask.streamOutput && currentTask.streamOutput.length > 0;

  // Show the stream section even if empty (to show "waiting" state)
  const showStreamSection = isCurrent && (currentTask || isExecuting || project.status === 'In Progress');

  // Reference for auto-scroll
  const streamEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when new entries arrive
  useEffect(() => {
    if (showLiveStream && streamEndRef.current) {
      streamEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [currentTask?.streamOutput?.length, showLiveStream]);

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

            {/* Live Agent Stream - only shows when stage is in progress with active task */}
            {showLiveStream && currentTask && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.35 }}
                style={{ marginBottom: '24px' }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <h3 style={{ fontSize: '11px', color: 'var(--text-dim)', letterSpacing: '0.05em', textTransform: 'uppercase' }}>
                      Live Agent Activity
                    </h3>
                    {execution?.status === 'running' && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <div
                          style={{
                            width: '6px',
                            height: '6px',
                            borderRadius: '50%',
                            background: '#22c55e',
                            animation: 'pulse 1.5s ease-in-out infinite',
                          }}
                        />
                        <span style={{ fontSize: '10px', color: '#22c55e', fontWeight: 500 }}>LIVE</span>
                      </div>
                    )}
                    {execution?.status === 'paused' && (
                      <span style={{ fontSize: '10px', color: 'var(--text-dim)', fontWeight: 500 }}>PAUSED</span>
                    )}
                  </div>
                  <span style={{ fontSize: '11px', color: 'var(--text-dim)', fontFamily: 'monospace' }}>
                    {currentTask.progress}% complete
                  </span>
                </div>

                {/* Progress bar */}
                <div style={{ marginBottom: '16px' }}>
                  <div
                    style={{
                      height: '6px',
                      background: 'rgba(255, 255, 255, 0.08)',
                      borderRadius: '3px',
                      overflow: 'hidden',
                    }}
                  >
                    <motion.div
                      style={{
                        height: '100%',
                        background: 'linear-gradient(90deg, var(--accent) 0%, var(--accent-secondary) 100%)',
                        borderRadius: '3px',
                      }}
                      initial={{ width: 0 }}
                      animate={{ width: `${currentTask.progress}%` }}
                      transition={{ duration: 0.3, ease: 'easeOut' }}
                    />
                  </div>
                  {currentTask.currentStep && (
                    <p style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '8px' }}>
                      {currentTask.currentStep}
                    </p>
                  )}
                </div>

                {/* Stream entries */}
                <div
                  style={{
                    maxHeight: '280px',
                    overflowY: 'auto',
                    padding: '4px',
                    borderRadius: '16px',
                    background: 'rgba(0, 0, 0, 0.2)',
                    border: '1px solid rgba(255, 255, 255, 0.06)',
                  }}
                  className="scrollbar-fade"
                >
                  <AnimatePresence mode="popLayout">
                    {currentTask.streamOutput.map((entry, idx) => (
                      <StreamEntryItem
                        key={entry.id}
                        entry={entry}
                        isLatest={idx === currentTask.streamOutput.length - 1}
                      />
                    ))}
                  </AnimatePresence>
                  <div ref={streamEndRef} />
                </div>

                {/* Waiting indicator when stream is empty but task exists */}
                {currentTask.streamOutput.length === 0 && (
                  <div
                    style={{
                      padding: '24px',
                      borderRadius: '14px',
                      background: 'rgba(255, 255, 255, 0.02)',
                      border: '1px solid rgba(255, 255, 255, 0.06)',
                      textAlign: 'center',
                    }}
                  >
                    <Loader2
                      style={{
                        width: '24px',
                        height: '24px',
                        color: 'var(--accent)',
                        margin: '0 auto 12px',
                        animation: 'spin 1s linear infinite',
                      }}
                    />
                    <p style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
                      Waiting for agent to start...
                    </p>
                  </div>
                )}
              </motion.div>
            )}

            {/* In Progress indicator when current but no task yet - offer to start execution */}
            {isCurrent && !showLiveStream && (project.status === 'In Progress' || project.status === 'Not Started') && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.35 }}
                style={{ marginBottom: '24px' }}
              >
                <h3 style={{ fontSize: '11px', color: 'var(--text-dim)', letterSpacing: '0.05em', textTransform: 'uppercase', marginBottom: '12px' }}>
                  Agent Activity
                </h3>
                <div
                  style={{
                    padding: '20px',
                    borderRadius: '14px',
                    background: 'linear-gradient(135deg, rgba(255, 107, 53, 0.08) 0%, rgba(255, 107, 53, 0.02) 100%)',
                    border: '1px solid rgba(255, 107, 53, 0.15)',
                  }}
                >
                  {isExecuting ? (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                      <div
                        style={{
                          width: '44px',
                          height: '44px',
                          borderRadius: '12px',
                          background: 'rgba(255, 107, 53, 0.15)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          flexShrink: 0,
                        }}
                      >
                        <Loader2
                          style={{
                            width: '22px',
                            height: '22px',
                            color: 'var(--accent)',
                            animation: 'spin 1s linear infinite',
                          }}
                        />
                      </div>
                      <div>
                        <p style={{ fontSize: '14px', fontWeight: 500, color: 'var(--text-main)', marginBottom: '4px' }}>
                          Initializing...
                        </p>
                        <p style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                          {stage.agent} is starting work on this stage
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div style={{ textAlign: 'center' }}>
                      <div
                        style={{
                          width: '56px',
                          height: '56px',
                          borderRadius: '16px',
                          background: 'rgba(255, 107, 53, 0.15)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          margin: '0 auto 16px',
                        }}
                      >
                        <Brain style={{ width: '28px', height: '28px', color: 'var(--accent)' }} />
                      </div>
                      <p style={{ fontSize: '14px', fontWeight: 500, color: 'var(--text-main)', marginBottom: '6px' }}>
                        No active agent execution
                      </p>
                      <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '16px' }}>
                        Start the pipeline to see {stage.agent}'s live thought process
                      </p>
                      <StartPipelineButton projectId={project.id} />
                    </div>
                  )}
                </div>
              </motion.div>
            )}

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
