'use client';

import { PipelineProject, STAGES, PIPELINE_STATUS_COLORS, PIPELINE_PRIORITY_COLORS } from '@/lib/types';
import { useState } from 'react';
import { StageDetailModal } from './StageDetailModal';
import { StageIcon } from './StageIcon';
import { motion, AnimatePresence } from 'motion/react';
import { useDashboardStore } from '@/lib/store';
import { Loader2 } from 'lucide-react';
import {
  ChevronLeft,
  Github,
  Globe,
  FileText,
  ExternalLink,
  AlertTriangle,
  Check,
  Link2,
  Clock,
  Users,
  Target,
  Pencil,
  X,
  Save,
  Rocket,
  ListMusic,
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Square,
  Zap
} from 'lucide-react';
import {
  initializePipeline,
  pausePipelineExecution,
  resumePipelineExecution,
  skipCurrentStage,
  restartCurrentStage,
  stopPipelineExecution,
} from '@/lib/executionEngine';

interface ProjectDetailViewProps {
  project: PipelineProject;
  onBack: () => void;
  onUpdate?: (updatedProject: PipelineProject) => void;
}

// Status options for the dropdown
const STATUS_OPTIONS: PipelineProject['status'][] = ['Not Started', 'In Progress', 'Blocked', 'Review', 'Complete'];
const PRIORITY_OPTIONS: PipelineProject['priority'][] = ['Critical', 'High', 'Medium', 'Low'];

// Edit Project Modal
function EditProjectModal({
  project,
  onClose,
  onSave,
}: {
  project: PipelineProject;
  onClose: () => void;
  onSave: (updatedProject: PipelineProject) => void;
}) {
  const [formData, setFormData] = useState<PipelineProject>({ ...project });
  const [activeTab, setActiveTab] = useState<'general' | 'appearance' | 'links' | 'deliverables'>('general');

  const handleSave = () => {
    onSave(formData);
    onClose();
  };

  const updateField = <K extends keyof PipelineProject>(key: K, value: PipelineProject[K]) => {
    setFormData(prev => ({ ...prev, [key]: value }));
  };

  const updateDeliverable = (key: keyof PipelineProject['deliverables'], value: string) => {
    setFormData(prev => ({
      ...prev,
      deliverables: { ...prev.deliverables, [key]: value || null },
    }));
  };

  const inputStyle = {
    width: '100%',
    padding: '12px 16px',
    borderRadius: '12px',
    border: '1px solid rgba(255, 255, 255, 0.1)',
    background: 'rgba(255, 255, 255, 0.04)',
    color: 'var(--text-main)',
    fontSize: '14px',
    outline: 'none',
    transition: 'all 0.2s ease',
  };

  const labelStyle = {
    display: 'block',
    fontSize: '12px',
    fontWeight: 500 as const,
    color: 'var(--text-dim)',
    marginBottom: '8px',
    textTransform: 'uppercase' as const,
    letterSpacing: '0.04em',
  };

  const tabStyle = (isActive: boolean) => ({
    padding: '10px 20px',
    fontSize: '13px',
    fontWeight: 500,
    color: isActive ? 'var(--accent)' : 'var(--text-dim)',
    background: isActive ? 'rgba(255, 107, 53, 0.1)' : 'transparent',
    border: 'none',
    borderRadius: '10px',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
  });

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0, 0, 0, 0.7)',
          backdropFilter: 'blur(8px)',
          zIndex: 100,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '40px',
        }}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          onClick={(e) => e.stopPropagation()}
          style={{
            width: '100%',
            maxWidth: '640px',
            maxHeight: '85vh',
            background: 'linear-gradient(180deg, rgba(28, 28, 32, 0.98) 0%, rgba(18, 18, 22, 0.99) 100%)',
            borderRadius: '24px',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            boxShadow: '0 32px 64px -16px rgba(0, 0, 0, 0.6)',
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          {/* Header */}
          <div
            style={{
              padding: '24px 28px',
              borderBottom: '1px solid rgba(255, 255, 255, 0.06)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <div>
              <h2 style={{ fontSize: '20px', fontWeight: 600, color: 'var(--text-main)', marginBottom: '4px' }}>
                Edit Project
              </h2>
              <p style={{ fontSize: '13px', color: 'var(--text-dim)' }}>
                Update project details and configuration
              </p>
            </div>
            <button
              onClick={onClose}
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '10px',
                border: 'none',
                background: 'rgba(255, 255, 255, 0.04)',
                color: 'var(--text-dim)',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'all 0.2s ease',
              }}
            >
              <X style={{ width: '18px', height: '18px' }} />
            </button>
          </div>

          {/* Tabs */}
          <div
            style={{
              padding: '16px 28px',
              borderBottom: '1px solid rgba(255, 255, 255, 0.04)',
              display: 'flex',
              gap: '8px',
            }}
          >
            <button style={tabStyle(activeTab === 'general')} onClick={() => setActiveTab('general')}>
              General
            </button>
            <button style={tabStyle(activeTab === 'appearance')} onClick={() => setActiveTab('appearance')}>
              Appearance
            </button>
            <button style={tabStyle(activeTab === 'links')} onClick={() => setActiveTab('links')}>
              Links
            </button>
            <button style={tabStyle(activeTab === 'deliverables')} onClick={() => setActiveTab('deliverables')}>
              Deliverables
            </button>
          </div>

          {/* Content */}
          <div style={{ flex: 1, overflowY: 'auto', padding: '24px 28px' }}>
            {activeTab === 'general' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                {/* Title */}
                <div>
                  <label style={labelStyle}>Project Title</label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) => updateField('title', e.target.value)}
                    style={inputStyle}
                    placeholder="Enter project title"
                  />
                </div>

                {/* Subtitle */}
                <div>
                  <label style={labelStyle}>Subtitle (optional)</label>
                  <input
                    type="text"
                    value={formData.subtitle || ''}
                    onChange={(e) => updateField('subtitle', e.target.value || undefined)}
                    style={inputStyle}
                    placeholder="e.g., AI Social Media Autoposter"
                  />
                </div>

                {/* Status & Priority Row */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                  <div>
                    <label style={labelStyle}>Status</label>
                    <select
                      value={formData.status}
                      onChange={(e) => updateField('status', e.target.value as PipelineProject['status'])}
                      style={{ ...inputStyle, cursor: 'pointer' }}
                    >
                      {STATUS_OPTIONS.map(status => (
                        <option key={status} value={status}>{status}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label style={labelStyle}>Priority</label>
                    <select
                      value={formData.priority}
                      onChange={(e) => updateField('priority', e.target.value as PipelineProject['priority'])}
                      style={{ ...inputStyle, cursor: 'pointer' }}
                    >
                      {PRIORITY_OPTIONS.map(priority => (
                        <option key={priority} value={priority}>{priority}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Stage */}
                <div>
                  <label style={labelStyle}>Current Stage</label>
                  <select
                    value={formData.stageIndex}
                    onChange={(e) => {
                      const idx = parseInt(e.target.value);
                      updateField('stageIndex', idx);
                      updateField('stage', STAGES[idx]?.name || '');
                      updateField('agent', STAGES[idx]?.agent || '');
                    }}
                    style={{ ...inputStyle, cursor: 'pointer' }}
                  >
                    {STAGES.map((stage, idx) => (
                      <option key={stage.name} value={idx}>{stage.name}</option>
                    ))}
                  </select>
                </div>

                {/* Progress */}
                <div>
                  <label style={labelStyle}>Progress ({Math.round(formData.progress * 100)}%)</label>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.01"
                    value={formData.progress}
                    onChange={(e) => updateField('progress', parseFloat(e.target.value))}
                    style={{
                      width: '100%',
                      accentColor: 'var(--accent)',
                    }}
                  />
                </div>

                {/* Blockers */}
                <div>
                  <label style={labelStyle}>Blockers</label>
                  <textarea
                    value={formData.blockers}
                    onChange={(e) => updateField('blockers', e.target.value)}
                    style={{ ...inputStyle, minHeight: '80px', resize: 'vertical' }}
                    placeholder="Describe any blockers..."
                  />
                </div>

                {/* Notes */}
                <div>
                  <label style={labelStyle}>Notes</label>
                  <textarea
                    value={formData.notes}
                    onChange={(e) => updateField('notes', e.target.value)}
                    style={{ ...inputStyle, minHeight: '100px', resize: 'vertical' }}
                    placeholder="Additional notes..."
                  />
                </div>
              </div>
            )}

            {activeTab === 'appearance' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                {/* Logo URL */}
                <div>
                  <label style={labelStyle}>Product Logo URL</label>
                  <div style={{ display: 'flex', gap: '16px', alignItems: 'flex-start' }}>
                    {/* Logo Preview */}
                    <div
                      style={{
                        width: '72px',
                        height: '72px',
                        borderRadius: '16px',
                        background: formData.logoUrl
                          ? `url(${formData.logoUrl}) center/cover`
                          : 'linear-gradient(135deg, var(--accent) 0%, var(--accent-secondary) 100%)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                        border: '1px solid rgba(255, 255, 255, 0.1)',
                      }}
                    >
                      {!formData.logoUrl && (
                        <span style={{ fontSize: '28px', fontWeight: 700, color: 'white' }}>
                          {formData.title.charAt(0).toUpperCase()}
                        </span>
                      )}
                    </div>
                    <div style={{ flex: 1 }}>
                      <input
                        type="url"
                        value={formData.logoUrl || ''}
                        onChange={(e) => updateField('logoUrl', e.target.value)}
                        style={inputStyle}
                        placeholder="https://example.com/logo.png"
                      />
                      <p style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '8px' }}>
                        Recommended: Square image, 256x256px or larger
                      </p>
                    </div>
                  </div>
                </div>

                {/* Animated Background Preset */}
                <div>
                  <label style={labelStyle}>Animated Background</label>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px' }}>
                    {([
                      { id: 'none', name: 'None', colors: ['#0a0806', '#0a0806'] },
                      { id: 'aurora', name: 'Aurora', colors: ['#00d4aa', '#7c3aed', '#0ea5e9'] },
                      { id: 'nebula', name: 'Nebula', colors: ['#a855f7', '#ec4899', '#6366f1'] },
                      { id: 'ember', name: 'Ember', colors: ['#ff6b35', '#dc2626', '#fbbf24'] },
                      { id: 'ocean', name: 'Ocean', colors: ['#0ea5e9', '#14b8a6', '#0284c7'] },
                      { id: 'midnight', name: 'Midnight', colors: ['#3730a3', '#4338ca', '#1e1b4b'] },
                    ] as const).map((preset) => (
                      <button
                        key={preset.id}
                        onClick={() => updateField('backgroundPreset', preset.id)}
                        style={{
                          padding: '12px',
                          borderRadius: '12px',
                          border: formData.backgroundPreset === preset.id || (!formData.backgroundPreset && preset.id === 'none')
                            ? '2px solid var(--accent)'
                            : '1px solid rgba(255, 255, 255, 0.1)',
                          background: 'rgba(255, 255, 255, 0.02)',
                          cursor: 'pointer',
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'center',
                          gap: '8px',
                          transition: 'all 0.2s ease',
                        }}
                      >
                        <div
                          style={{
                            width: '100%',
                            height: '40px',
                            borderRadius: '8px',
                            background: preset.id === 'none'
                              ? '#0a0806'
                              : `linear-gradient(135deg, ${preset.colors.join(', ')})`,
                            position: 'relative',
                            overflow: 'hidden',
                          }}
                        >
                          {preset.id !== 'none' && (
                            <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(circle at 30% 30%, rgba(255,255,255,0.2) 0%, transparent 60%)' }} />
                          )}
                        </div>
                        <span style={{ fontSize: '11px', color: 'var(--text-secondary)', fontWeight: 500 }}>{preset.name}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Background Color */}
                {(!formData.backgroundPreset || formData.backgroundPreset === 'none') && (
                <div>
                  <label style={labelStyle}>Custom Background Color</label>
                  <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                    <input
                      type="color"
                      value={formData.backgroundColor || '#0a0806'}
                      onChange={(e) => updateField('backgroundColor', e.target.value)}
                      style={{
                        width: '48px',
                        height: '48px',
                        borderRadius: '12px',
                        border: '1px solid rgba(255, 255, 255, 0.1)',
                        background: 'transparent',
                        cursor: 'pointer',
                        padding: '4px',
                      }}
                    />
                    <input
                      type="text"
                      value={formData.backgroundColor || '#0a0806'}
                      onChange={(e) => updateField('backgroundColor', e.target.value)}
                      style={{ ...inputStyle, flex: 1, fontFamily: 'monospace' }}
                      placeholder="#0a0806"
                    />
                    <button
                      onClick={() => updateField('backgroundColor', undefined)}
                      style={{
                        padding: '12px 16px',
                        borderRadius: '10px',
                        border: '1px solid rgba(255, 255, 255, 0.1)',
                        background: 'rgba(255, 255, 255, 0.04)',
                        color: 'var(--text-dim)',
                        fontSize: '12px',
                        cursor: 'pointer',
                      }}
                    >
                      Reset
                    </button>
                  </div>
                </div>
                )}

                {/* Hero Background Image */}
                <div>
                  <label style={labelStyle}>Hero Background Image</label>
                  <input
                    type="url"
                    value={formData.heroBackgroundImage || ''}
                    onChange={(e) => updateField('heroBackgroundImage', e.target.value)}
                    style={inputStyle}
                    placeholder="https://example.com/background.jpg"
                  />
                  <p style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '8px' }}>
                    Image will be displayed with fade effect in the hero section
                  </p>
                  {/* Preview */}
                  {formData.heroBackgroundImage && (
                    <div
                      style={{
                        marginTop: '12px',
                        height: '100px',
                        borderRadius: '12px',
                        background: `linear-gradient(135deg, rgba(0,0,0,0.6) 0%, rgba(0,0,0,0.3) 100%), url(${formData.heroBackgroundImage}) center/cover`,
                        border: '1px solid rgba(255, 255, 255, 0.1)',
                        display: 'flex',
                        alignItems: 'flex-end',
                        padding: '12px',
                      }}
                    >
                      <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.7)' }}>Preview</span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {activeTab === 'links' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                {/* Notion URL */}
                <div>
                  <label style={labelStyle}>Notion Page URL</label>
                  <input
                    type="url"
                    value={formData.url}
                    onChange={(e) => updateField('url', e.target.value)}
                    style={inputStyle}
                    placeholder="https://notion.so/..."
                  />
                </div>

                {/* GitHub URL */}
                <div>
                  <label style={labelStyle}>GitHub Repository</label>
                  <input
                    type="url"
                    value={formData.githubUrl}
                    onChange={(e) => updateField('githubUrl', e.target.value)}
                    style={inputStyle}
                    placeholder="https://github.com/..."
                  />
                </div>

                {/* Deploy URL */}
                <div>
                  <label style={labelStyle}>Live Site URL</label>
                  <input
                    type="url"
                    value={formData.deployUrl}
                    onChange={(e) => updateField('deployUrl', e.target.value)}
                    style={inputStyle}
                    placeholder="https://..."
                  />
                </div>
              </div>
            )}

            {activeTab === 'deliverables' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                <p style={{ fontSize: '13px', color: 'var(--text-dim)', marginBottom: '8px' }}>
                  Add links to deliverable documents for each stage
                </p>

                {STAGES.filter(s => s.deliverableKey).map((stage) => (
                  <div key={stage.deliverableKey}>
                    <label style={labelStyle}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <StageIcon name={stage.icon} style={{ width: '14px', height: '14px' }} />
                        {stage.name.split('. ')[1]} Deliverable
                      </span>
                    </label>
                    <input
                      type="url"
                      value={formData.deliverables[stage.deliverableKey as keyof typeof formData.deliverables] || ''}
                      onChange={(e) => updateDeliverable(stage.deliverableKey as keyof PipelineProject['deliverables'], e.target.value)}
                      style={inputStyle}
                      placeholder={`URL to ${stage.name.split('. ')[1].toLowerCase()} document...`}
                    />
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Footer */}
          <div
            style={{
              padding: '20px 28px',
              borderTop: '1px solid rgba(255, 255, 255, 0.06)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'flex-end',
              gap: '12px',
            }}
          >
            <button
              onClick={onClose}
              style={{
                padding: '12px 24px',
                borderRadius: '12px',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                background: 'transparent',
                color: 'var(--text-secondary)',
                fontSize: '14px',
                fontWeight: 500,
                cursor: 'pointer',
                transition: 'all 0.2s ease',
              }}
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              style={{
                padding: '12px 24px',
                borderRadius: '12px',
                border: 'none',
                background: 'linear-gradient(135deg, var(--accent) 0%, var(--accent-secondary) 100%)',
                color: 'white',
                fontSize: '14px',
                fontWeight: 600,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                boxShadow: '0 4px 16px rgba(255, 107, 53, 0.3)',
                transition: 'all 0.2s ease',
              }}
            >
              <Save style={{ width: '16px', height: '16px' }} />
              Save Changes
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

// Circular progress with animated stroke
function ProgressCircle({ progress, size = 140 }: { progress: number; size?: number }) {
  const strokeWidth = 6;
  const radius = (size - strokeWidth * 2) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (progress / 100) * circumference;

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
        {/* Background track */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="rgba(255, 255, 255, 0.06)"
          strokeWidth={strokeWidth}
        />
        {/* Progress arc */}
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="url(#progressGradientDetail)"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 1, ease: [0.4, 0, 0.2, 1] }}
          style={{ filter: 'drop-shadow(0 0 8px rgba(255, 107, 53, 0.4))' }}
        />
        <defs>
          <linearGradient id="progressGradientDetail" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="var(--accent)" />
            <stop offset="100%" stopColor="var(--accent-secondary)" />
          </linearGradient>
        </defs>
      </svg>
      {/* Center content */}
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <motion.span
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.3 }}
          style={{
            fontSize: '36px',
            fontWeight: 700,
            fontFamily: '"JetBrains Mono", ui-monospace, monospace',
            color: 'var(--text-main)',
            lineHeight: 1,
          }}
        >
          {progress}%
        </motion.span>
        <span style={{ fontSize: '11px', color: 'var(--text-dim)', marginTop: '4px', letterSpacing: '0.08em' }}>
          COMPLETE
        </span>
      </div>
    </div>
  );
}

// Stage node in pipeline visualization
function StageNode({
  stage,
  index,
  isCompleted,
  isCurrent,
  hasDeliverable,
  isBlocked,
  isWorking,
  agentActivity,
  onClick,
}: {
  stage: typeof STAGES[0];
  index: number;
  isCompleted: boolean;
  isCurrent: boolean;
  hasDeliverable: boolean;
  isBlocked: boolean;
  isWorking?: boolean;
  agentActivity?: string;
  onClick: () => void;
}) {
  const [showTooltip, setShowTooltip] = useState(false);

  // Activity descriptions for each stage when agent is working
  const getActivityDescription = () => {
    if (agentActivity) return agentActivity;
    if (!isWorking) return null;

    const activities: Record<string, string> = {
      'Intake': 'Reviewing project requirements...',
      'Research': 'Analyzing market data & competitors...',
      'Spec': 'Drafting product specification...',
      'Architecture': 'Designing system architecture...',
      'Design': 'Creating UI mockups & prototypes...',
      'Development': 'Writing & testing code...',
      'Testing': 'Running E2E tests & QA checks...',
      'Code Review': 'Reviewing pull requests...',
      'Security': 'Scanning for vulnerabilities...',
      'Documentation': 'Writing technical docs...',
      'DevOps': 'Configuring CI/CD pipeline...',
      'Launched': 'Monitoring deployment...',
    };

    const stageName = stage.name.split('. ')[1];
    return activities[stageName] || 'Processing...';
  };

  // Estimated time remaining for each stage
  const getEstimatedTime = () => {
    if (!isWorking) return null;

    const estimates: Record<string, string> = {
      'Intake': '~5 min',
      'Research': '~15 min',
      'Spec': '~20 min',
      'Architecture': '~10 min',
      'Design': '~25 min',
      'Development': '~45 min',
      'Testing': '~15 min',
      'Code Review': '~10 min',
      'Security': '~8 min',
      'Documentation': '~12 min',
      'DevOps': '~10 min',
      'Launched': '~2 min',
    };

    const stageName = stage.name.split('. ')[1];
    return estimates[stageName] || '~10 min';
  };

  return (
    <motion.button
      onClick={onClick}
      onMouseEnter={() => setShowTooltip(true)}
      onMouseLeave={() => setShowTooltip(false)}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      className="flex flex-col items-center group relative"
      style={{ minWidth: '80px' }}
    >
      {/* Hover Tooltip - centered above the node */}
      <AnimatePresence>
        {showTooltip && isCurrent && isWorking && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 4 }}
            transition={{ duration: 0.15 }}
            className="absolute z-50 pointer-events-none"
            style={{
              bottom: 'calc(100% + 8px)',
              left: '50%',
              marginLeft: '-100px',
              width: '200px',
            }}
          >
            <div
              style={{
                padding: '10px 14px',
                borderRadius: '12px',
                background: 'rgba(20, 20, 25, 0.95)',
                backdropFilter: 'blur(12px)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4)',
                textAlign: 'center',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', marginBottom: '4px' }}>
                <div
                  style={{
                    width: '8px',
                    height: '8px',
                    borderRadius: '50%',
                    background: isBlocked ? '#ef4444' : '#22c55e',
                    boxShadow: isBlocked ? '0 0 8px rgba(239, 68, 68, 0.6)' : '0 0 8px rgba(34, 197, 94, 0.6)',
                    animation: 'pulse 1.5s ease-in-out infinite',
                  }}
                />
                <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-main)' }}>
                  {stage.agent}
                </span>
              </div>
              <p style={{ fontSize: '11px', color: 'var(--text-secondary)', marginBottom: '6px' }}>
                {getActivityDescription()}
              </p>
              <div
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px',
                  padding: '4px 8px',
                  borderRadius: '6px',
                  background: 'rgba(255, 255, 255, 0.06)',
                  fontSize: '10px',
                  color: 'var(--text-dim)',
                }}
              >
                <Clock style={{ width: '10px', height: '10px' }} />
                <span>{getEstimatedTime()} remaining</span>
              </div>
            </div>
            {/* Arrow pointing down at node */}
            <div
              style={{
                position: 'absolute',
                bottom: '-6px',
                left: '50%',
                marginLeft: '-6px',
                width: '0',
                height: '0',
                borderLeft: '6px solid transparent',
                borderRight: '6px solid transparent',
                borderTop: '6px solid rgba(20, 20, 25, 0.95)',
              }}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Active working - border shimmer effect */}
      {isCurrent && isWorking && !isBlocked && (
        <div
          className="absolute"
          style={{
            width: '64px',
            height: '64px',
            borderRadius: '18px',
            top: '-4px',
            left: '50%',
            marginLeft: '-32px',
            overflow: 'hidden',
          }}
        >
          {/* Rotating gradient - larger than container so rotation stays smooth */}
          <motion.div
            style={{
              position: 'absolute',
              top: '-50%',
              left: '-50%',
              width: '200%',
              height: '200%',
              background: 'conic-gradient(from 0deg, transparent 0deg, transparent 70deg, var(--accent) 90deg, var(--accent-secondary) 110deg, transparent 130deg, transparent 360deg)',
            }}
            animate={{ rotate: 360 }}
            transition={{
              duration: 2.5,
              ease: 'linear',
              repeat: Infinity,
            }}
          />
          {/* Inner mask to create border effect */}
          <div
            style={{
              position: 'absolute',
              top: '2px',
              left: '2px',
              right: '2px',
              bottom: '2px',
              borderRadius: '16px',
              background: 'var(--bg)',
            }}
          />
        </div>
      )}

      {/* Blocked animation */}
      {isCurrent && isBlocked && (
        <motion.div
          className="absolute"
          style={{
            width: '68px',
            height: '68px',
            borderRadius: '18px',
            border: '2px dashed #ef4444',
            top: '-6px',
            left: '50%',
            marginLeft: '-34px',
            opacity: 0.6,
          }}
          animate={{
            rotate: [0, 360],
            opacity: [0.4, 0.7, 0.4],
          }}
          transition={{
            rotate: { duration: 8, ease: 'linear', repeat: Infinity },
            opacity: { duration: 2, ease: 'easeInOut', repeat: Infinity },
          }}
        />
      )}

      {/* Node */}
      <motion.div
        whileHover={{ scale: 1.1, y: -2 }}
        whileTap={{ scale: 0.95 }}
        className="relative"
        style={{
          width: '56px',
          height: '56px',
          borderRadius: '16px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: isCompleted
            ? 'linear-gradient(135deg, #22c55e 0%, #16a34a 100%)'
            : isCurrent
              ? isBlocked
                ? 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)'
                : 'linear-gradient(135deg, var(--accent) 0%, var(--accent-secondary) 100%)'
              : 'rgba(255, 255, 255, 0.04)',
          border: isCompleted || isCurrent ? 'none' : '1px solid rgba(255, 255, 255, 0.08)',
          boxShadow: isCompleted
            ? '0 8px 24px -4px rgba(34, 197, 94, 0.35)'
            : isCurrent
              ? isBlocked
                ? '0 8px 24px -4px rgba(239, 68, 68, 0.35)'
                : '0 8px 24px -4px rgba(255, 107, 53, 0.35)'
              : 'none',
          cursor: 'pointer',
          transition: 'all 0.3s ease',
        }}
      >
        {isCompleted ? (
          <Check className="w-6 h-6 text-white" strokeWidth={3} />
        ) : (
          <StageIcon
            name={stage.icon}
            className="w-5 h-5"
            style={{ color: isCurrent ? 'white' : 'var(--text-dim)' }}
          />
        )}

        {/* Deliverable indicator */}
        {hasDeliverable && (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="absolute -top-1 -right-1"
            style={{
              width: '16px',
              height: '16px',
              borderRadius: '50%',
              background: '#fbbf24',
              border: '2px solid var(--bg)',
              boxShadow: '0 2px 8px rgba(251, 191, 36, 0.4)',
            }}
          />
        )}

        {/* Working indicator dot */}
        {isCurrent && isWorking && !isCompleted && (
          <motion.div
            className="absolute -bottom-1 -right-1"
            style={{
              width: '14px',
              height: '14px',
              borderRadius: '50%',
              background: isBlocked ? '#ef4444' : '#22c55e',
              border: '2px solid var(--bg)',
            }}
            animate={{
              scale: [1, 1.2, 1],
              boxShadow: [
                '0 0 0 0 rgba(34, 197, 94, 0.4)',
                '0 0 0 6px rgba(34, 197, 94, 0)',
                '0 0 0 0 rgba(34, 197, 94, 0.4)',
              ],
            }}
            transition={{
              duration: 1.5,
              ease: 'easeInOut',
              repeat: Infinity,
            }}
          />
        )}
      </motion.div>

      {/* Label */}
      <div className="mt-3 text-center">
        <p
          style={{
            fontSize: '12px',
            fontWeight: 500,
            color: isCurrent
              ? 'var(--text-main)'
              : isCompleted
                ? '#22c55e'
                : 'var(--text-dim)',
            transition: 'color 0.2s ease',
          }}
        >
          {stage.name.split('. ')[1]}
        </p>
        <p
          className="opacity-0 group-hover:opacity-100 transition-opacity"
          style={{
            fontSize: '10px',
            color: 'var(--text-muted)',
            marginTop: '2px',
          }}
        >
          {stage.agent}
        </p>
      </div>
    </motion.button>
  );
}

// Quick stat card
function StatCard({ icon: Icon, label, value, color, delay = 0 }: {
  icon: React.ElementType;
  label: string;
  value: string | number;
  color: string;
  delay?: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay }}
      style={{
        padding: '20px',
        borderRadius: '16px',
        background: 'rgba(255, 255, 255, 0.02)',
        border: '1px solid rgba(255, 255, 255, 0.06)',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <div
          style={{
            width: '40px',
            height: '40px',
            borderRadius: '12px',
            background: `${color}15`,
            border: `1px solid ${color}25`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Icon style={{ width: '18px', height: '18px', color }} />
        </div>
        <div>
          <p style={{ fontSize: '11px', color: 'var(--text-dim)', letterSpacing: '0.04em', textTransform: 'uppercase' }}>
            {label}
          </p>
          <p style={{ fontSize: '18px', fontWeight: 600, fontFamily: '"JetBrains Mono", ui-monospace, monospace', color: 'var(--text-main)', marginTop: '2px' }}>
            {value}
          </p>
        </div>
      </div>
    </motion.div>
  );
}

// Deliverable row item
function DeliverableRow({
  stage,
  isCompleted,
  isCurrent,
  deliverableUrl,
  index,
}: {
  stage: typeof STAGES[0];
  isCompleted: boolean;
  isCurrent: boolean;
  deliverableUrl: string | null;
  index: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: 0.3 + index * 0.04 }}
      className={`flex items-center gap-4 transition-colors ${deliverableUrl ? 'cursor-pointer hover:bg-white/[0.02]' : ''}`}
      style={{
        padding: '16px 20px',
        borderBottom: '1px solid rgba(255, 255, 255, 0.04)',
      }}
      onClick={() => deliverableUrl && window.open(deliverableUrl, '_blank')}
    >
      {/* Stage Icon */}
      <div
        style={{
          width: '44px',
          height: '44px',
          borderRadius: '14px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: isCompleted
            ? 'rgba(34, 197, 94, 0.12)'
            : isCurrent
              ? 'rgba(255, 107, 53, 0.12)'
              : 'rgba(255, 255, 255, 0.03)',
          border: `1px solid ${isCompleted ? 'rgba(34, 197, 94, 0.2)' : isCurrent ? 'rgba(255, 107, 53, 0.2)' : 'rgba(255, 255, 255, 0.06)'}`,
          flexShrink: 0,
        }}
      >
        <StageIcon
          name={stage.icon}
          style={{
            width: '20px',
            height: '20px',
            color: isCompleted
              ? '#22c55e'
              : isCurrent
                ? 'var(--accent)'
                : 'var(--text-dim)',
          }}
        />
      </div>

      {/* Stage Info */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <p
          style={{
            fontSize: '14px',
            fontWeight: 500,
            color: isCompleted || isCurrent ? 'var(--text-main)' : 'var(--text-dim)',
          }}
        >
          {stage.name.split('. ')[1]}
        </p>
        <p
          style={{
            fontSize: '12px',
            color: 'var(--text-dim)',
            marginTop: '2px',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
        >
          {stage.description}
        </p>
      </div>

      {/* Status Badge */}
      <div
        style={{
          padding: '6px 12px',
          borderRadius: '8px',
          fontSize: '11px',
          fontWeight: 500,
          background: isCompleted
            ? 'rgba(34, 197, 94, 0.12)'
            : isCurrent
              ? 'rgba(255, 107, 53, 0.12)'
              : 'rgba(255, 255, 255, 0.04)',
          color: isCompleted
            ? '#22c55e'
            : isCurrent
              ? 'var(--accent)'
              : 'var(--text-muted)',
        }}
      >
        {isCompleted ? 'Complete' : isCurrent ? 'In Progress' : 'Pending'}
      </div>

      {/* Link Icon */}
      <div style={{ width: '32px', display: 'flex', justifyContent: 'center' }}>
        {deliverableUrl ? (
          <ExternalLink style={{ width: '16px', height: '16px', color: '#3b82f6' }} />
        ) : (
          <Link2 style={{ width: '16px', height: '16px', color: 'var(--text-muted)', opacity: 0.4 }} />
        )}
      </div>
    </motion.div>
  );
}

// Kick Off Banner for new projects
function KickOffBanner({
  project,
  onKickOff,
  isKickingOff,
}: {
  project: PipelineProject;
  onKickOff: () => void;
  isKickingOff: boolean;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20, transition: { duration: 0.2 } }}
      style={{
        marginBottom: '32px',
        padding: '32px 40px',
        borderRadius: '24px',
        background: `linear-gradient(135deg, rgba(255, 107, 53, 0.12) 0%, rgba(168, 85, 247, 0.08) 100%)`,
        border: '1px solid rgba(255, 107, 53, 0.2)',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Background glow */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: 'radial-gradient(ellipse 60% 80% at 80% 20%, rgba(255, 107, 53, 0.15) 0%, transparent 60%)',
        }}
      />

      <div className="relative flex items-center justify-between gap-8">
        <div className="flex items-center gap-6">
          {/* Icon */}
          <motion.div
            initial={{ scale: 0.8, rotate: -10 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
            style={{
              width: '64px',
              height: '64px',
              borderRadius: '20px',
              background: 'linear-gradient(135deg, var(--accent) 0%, var(--accent-secondary) 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 8px 32px -4px rgba(255, 107, 53, 0.4)',
              flexShrink: 0,
            }}
          >
            <Rocket style={{ width: '28px', height: '28px', color: 'white' }} />
          </motion.div>

          {/* Text */}
          <div>
            <h2
              style={{
                fontSize: '22px',
                fontWeight: 700,
                color: 'var(--text-main)',
                marginBottom: '8px',
                letterSpacing: '-0.01em',
              }}
            >
              Ready to start {project.title}?
            </h2>
            <p style={{ fontSize: '14px', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
              <span style={{ color: 'var(--accent)', fontWeight: 500 }}>Product Researcher</span> will begin the Research phase
            </p>
          </div>
        </div>

        {/* CTA Button */}
        <motion.button
          onClick={onKickOff}
          disabled={isKickingOff}
          whileHover={isKickingOff ? {} : { scale: 1.03, y: -1 }}
          whileTap={isKickingOff ? {} : { scale: 0.98 }}
          style={{
            padding: '14px 28px',
            borderRadius: '14px',
            border: 'none',
            background: 'linear-gradient(135deg, var(--accent) 0%, var(--accent-secondary) 100%)',
            color: 'white',
            fontSize: '15px',
            fontWeight: 600,
            cursor: isKickingOff ? 'not-allowed' : 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            boxShadow: '0 8px 24px -4px rgba(255, 107, 53, 0.4)',
            transition: 'box-shadow 0.2s ease',
            flexShrink: 0,
            opacity: isKickingOff ? 0.8 : 1,
          }}
        >
          {isKickingOff ? (
            <>
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
              >
                <Loader2 style={{ width: '18px', height: '18px' }} />
              </motion.div>
              Initiating...
            </>
          ) : (
            <>
              <Rocket style={{ width: '18px', height: '18px' }} />
              Start Pipeline
            </>
          )}
        </motion.button>
      </div>
    </motion.div>
  );
}

// Helper function for delay
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export function ProjectDetailView({ project, onBack, onUpdate }: ProjectDetailViewProps) {
  const [selectedStage, setSelectedStage] = useState<number | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isKickingOff, setIsKickingOff] = useState(false);
  const [isQueueOpen, setIsQueueOpen] = useState(false);

  const { addEvent, setChatViewMode, getPipelineExecution, tasks } = useDashboardStore();

  // Get pipeline execution state
  const execution = getPipelineExecution(project.id);
  const isRunning = execution?.status === 'running';
  const isPaused = execution?.status === 'paused';
  const currentTask = execution?.currentTaskId ? tasks.find(t => t.id === execution.currentTaskId) : null;

  const completedStages = project.stageIndex;
  const totalStages = STAGES.length;
  const overallProgress = Math.round((completedStages / totalStages) * 100);

  const handleSaveProject = (updatedProject: PipelineProject) => {
    onUpdate?.(updatedProject);
  };

  const handleKickOff = async () => {
    setIsKickingOff(true);

    // Switch ChatPanel to activity view
    setChatViewMode('activity');

    // Initialize and start the pipeline using the execution engine
    initializePipeline(project.id);

    // Small delay for visual feedback
    await delay(500);

    setIsKickingOff(false);
  };

  // Playback control handlers
  const handlePauseResume = () => {
    if (isRunning) {
      pausePipelineExecution(project.id);
    } else if (isPaused) {
      resumePipelineExecution(project.id);
    }
  };

  const handleSkip = () => {
    skipCurrentStage(project.id);
  };

  const handleRestart = () => {
    restartCurrentStage(project.id);
  };

  const handleStop = () => {
    stopPipelineExecution(project.id);
  };

  return (
    <div className="h-full overflow-hidden flex flex-col relative">
      {/* Ambient background decoration (only when no preset is active) */}
      {(!project.backgroundPreset || project.backgroundPreset === 'none') && (
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background: `
              radial-gradient(ellipse 60% 40% at 70% 10%, rgba(255, 107, 53, 0.06) 0%, transparent 50%),
              radial-gradient(ellipse 50% 30% at 20% 80%, rgba(99, 102, 241, 0.04) 0%, transparent 50%)
            `,
          }}
        />
      )}

      {/* Scrollable Content */}
      <div className="flex-1 overflow-y-auto scrollbar-fade">
        <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '40px 48px 100px' }}>

          {/* Kick Off Banner - only for new projects */}
          <AnimatePresence>
            {project.status === 'Not Started' && (
              <KickOffBanner project={project} onKickOff={handleKickOff} isKickingOff={isKickingOff} />
            )}
          </AnimatePresence>

          {/* Hero Section */}
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr auto',
              gap: '48px',
              alignItems: 'center',
              padding: '40px',
              borderRadius: '24px',
              background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.02) 0%, rgba(255, 255, 255, 0.01) 100%)',
              border: '1px solid rgba(255, 255, 255, 0.06)',
              marginBottom: '40px',
              position: 'relative',
              overflow: 'hidden',
            }}
          >
            {/* Hero Background Image */}
            {project.heroBackgroundImage && (
              <div
                className="absolute inset-0 pointer-events-none"
                style={{
                  backgroundImage: `url(${project.heroBackgroundImage})`,
                  backgroundSize: 'cover',
                  backgroundPosition: 'center',
                  opacity: 0.15,
                  maskImage: 'linear-gradient(to bottom, rgba(0,0,0,0.8) 0%, rgba(0,0,0,0.3) 70%, transparent 100%)',
                  WebkitMaskImage: 'linear-gradient(to bottom, rgba(0,0,0,0.8) 0%, rgba(0,0,0,0.3) 70%, transparent 100%)',
                }}
              />
            )}

            {/* Background decoration */}
            <div
              className="absolute top-0 right-0 w-[400px] h-[400px] pointer-events-none"
              style={{
                background: 'radial-gradient(circle, rgba(255, 107, 53, 0.08) 0%, transparent 60%)',
                transform: 'translate(30%, -30%)',
              }}
            />

            {/* Edit Button - Top Right */}
            <motion.button
              onClick={() => setIsEditModalOpen(true)}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="absolute"
              style={{
                top: '20px',
                right: '20px',
                width: '44px',
                height: '44px',
                borderRadius: '14px',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                background: 'rgba(255, 255, 255, 0.04)',
                color: 'var(--text-dim)',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'all 0.2s ease',
                zIndex: 10,
              }}
              title="Edit project details"
            >
              <Pencil style={{ width: '18px', height: '18px' }} />
            </motion.button>

            <div className="relative">
              {/* Header Row: Logo + Title */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '24px', marginBottom: '24px' }}>
                {/* Product Logo */}
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.1 }}
                  style={{
                    width: '72px',
                    height: '72px',
                    borderRadius: '18px',
                    background: project.logoUrl
                      ? 'transparent'
                      : 'linear-gradient(135deg, var(--accent) 0%, var(--accent-secondary) 100%)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                    overflow: 'hidden',
                    boxShadow: '0 8px 32px -8px rgba(255, 107, 53, 0.4)',
                  }}
                >
                  {project.logoUrl ? (
                    <img
                      src={project.logoUrl}
                      alt={`${project.title} logo`}
                      style={{
                        width: '100%',
                        height: '100%',
                        objectFit: 'cover',
                        borderRadius: '18px',
                      }}
                    />
                  ) : (
                    <span
                      style={{
                        fontSize: '32px',
                        fontWeight: 700,
                        color: 'white',
                        textShadow: '0 2px 4px rgba(0,0,0,0.2)',
                      }}
                    >
                      {project.title.charAt(0).toUpperCase()}
                    </span>
                  )}
                </motion.div>

                {/* Title & Subtitle */}
                <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                  {/* Title */}
                  <h1
                    style={{
                      fontSize: '36px',
                      fontWeight: 700,
                      color: 'var(--text-main)',
                      lineHeight: 1.15,
                      letterSpacing: '-0.025em',
                      margin: 0,
                    }}
                  >
                    {project.title}
                  </h1>

                  {/* Subtitle */}
                  {project.subtitle && (
                    <p
                      style={{
                        fontSize: '15px',
                        color: 'var(--text-secondary)',
                        marginTop: '8px',
                        lineHeight: 1.4,
                      }}
                    >
                      {project.subtitle}
                    </p>
                  )}
                </div>
              </div>

              {/* Stage info */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                <div
                  style={{
                    width: '36px',
                    height: '36px',
                    borderRadius: '10px',
                    background: 'rgba(255, 255, 255, 0.04)',
                    border: '1px solid rgba(255, 255, 255, 0.08)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <StageIcon
                    name={STAGES[project.stageIndex]?.icon}
                    style={{ width: '18px', height: '18px', color: 'var(--text-secondary)' }}
                  />
                </div>
                <div>
                  <p style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>
                    Currently in <span style={{ color: 'var(--text-main)', fontWeight: 500 }}>{project.stage}</span>
                  </p>
                  <p style={{ fontSize: '13px', color: 'var(--text-dim)', marginTop: '2px' }}>
                    Assigned to {project.agent}
                  </p>
                </div>
              </div>

              {/* Quick Action Links */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: '24px' }}>
                {project.deployUrl && (
                  <a
                    href={project.deployUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      padding: '10px 16px',
                      borderRadius: '10px',
                      background: 'rgba(34, 197, 94, 0.1)',
                      border: '1px solid rgba(34, 197, 94, 0.2)',
                      color: '#22c55e',
                      textDecoration: 'none',
                      fontSize: '13px',
                      fontWeight: 500,
                      transition: 'all 0.2s ease',
                    }}
                  >
                    <Globe style={{ width: '16px', height: '16px' }} />
                    Live Site
                    <ExternalLink style={{ width: '12px', height: '12px', opacity: 0.6 }} />
                  </a>
                )}
                <a
                  href={project.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    padding: '10px 16px',
                    borderRadius: '10px',
                    background: 'rgba(255, 255, 255, 0.04)',
                    border: '1px solid rgba(255, 255, 255, 0.08)',
                    color: 'var(--text-secondary)',
                    textDecoration: 'none',
                    fontSize: '13px',
                    fontWeight: 500,
                    transition: 'all 0.2s ease',
                  }}
                >
                  <FileText style={{ width: '16px', height: '16px' }} />
                  Notion
                  <ExternalLink style={{ width: '12px', height: '12px', opacity: 0.6 }} />
                </a>
                {project.githubUrl && (
                  <a
                    href={project.githubUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      padding: '10px 16px',
                      borderRadius: '10px',
                      background: 'rgba(168, 85, 247, 0.08)',
                      border: '1px solid rgba(168, 85, 247, 0.15)',
                      color: '#a855f7',
                      textDecoration: 'none',
                      fontSize: '13px',
                      fontWeight: 500,
                      transition: 'all 0.2s ease',
                    }}
                  >
                    <Github style={{ width: '16px', height: '16px' }} />
                    GitHub
                    <ExternalLink style={{ width: '12px', height: '12px', opacity: 0.6 }} />
                  </a>
                )}
              </div>

              {/* Blocker Alert */}
              {project.blockers && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                  style={{
                    marginTop: '24px',
                    padding: '16px 20px',
                    borderRadius: '14px',
                    background: 'rgba(239, 68, 68, 0.08)',
                    border: '1px solid rgba(239, 68, 68, 0.2)',
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '14px',
                  }}
                >
                  <div
                    style={{
                      width: '36px',
                      height: '36px',
                      borderRadius: '10px',
                      background: 'rgba(239, 68, 68, 0.15)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                    }}
                  >
                    <AlertTriangle style={{ width: '18px', height: '18px', color: '#ef4444' }} />
                  </div>
                  <div>
                    <p style={{ fontSize: '13px', fontWeight: 600, color: '#ef4444', marginBottom: '4px' }}>
                      Blocker Detected
                    </p>
                    <p style={{ fontSize: '13px', color: 'rgba(239, 68, 68, 0.85)', lineHeight: 1.5 }}>
                      {project.blockers}
                    </p>
                  </div>
                </motion.div>
              )}
            </div>

            {/* Progress Circle */}
            <div className="relative">
              <ProgressCircle progress={overallProgress} />
            </div>
          </motion.section>

          {/* Pipeline Stages */}
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            style={{
              padding: '32px',
              borderRadius: '24px',
              background: 'rgba(255, 255, 255, 0.015)',
              border: '1px solid rgba(255, 255, 255, 0.06)',
              marginBottom: '32px',
            }}
          >
            <div style={{ marginBottom: '28px', display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
              <div>
                <h2 style={{ fontSize: '18px', fontWeight: 600, color: 'var(--text-main)', marginBottom: '6px' }}>
                  Pipeline Progress
                </h2>
                <p style={{ fontSize: '13px', color: 'var(--text-dim)' }}>
                  Click any stage to view details and deliverables
                </p>
              </div>

              {/* Queue Button */}
              <div className="relative">
                <motion.button
                  onClick={() => setIsQueueOpen(!isQueueOpen)}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    padding: '8px 14px',
                    borderRadius: '10px',
                    border: isQueueOpen ? '1px solid var(--accent)' : '1px solid rgba(255, 255, 255, 0.1)',
                    background: isQueueOpen ? 'rgba(255, 107, 53, 0.1)' : 'rgba(255, 255, 255, 0.04)',
                    color: isQueueOpen ? 'var(--accent)' : 'var(--text-secondary)',
                    cursor: 'pointer',
                    fontSize: '12px',
                    fontWeight: 500,
                    transition: 'all 0.2s ease',
                  }}
                >
                  <ListMusic style={{ width: '16px', height: '16px' }} />
                  <span>Queue</span>
                  <span
                    style={{
                      padding: '2px 6px',
                      borderRadius: '6px',
                      background: 'rgba(255, 255, 255, 0.1)',
                      fontSize: '10px',
                      fontWeight: 600,
                    }}
                  >
                    {STAGES.length - project.stageIndex}
                  </span>
                </motion.button>

                {/* Queue Popup */}
                <AnimatePresence>
                  {isQueueOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: -10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: -10, scale: 0.95 }}
                      transition={{ duration: 0.15 }}
                      style={{
                        position: 'absolute',
                        top: 'calc(100% + 8px)',
                        right: 0,
                        width: '320px',
                        maxHeight: '400px',
                        overflowY: 'auto',
                        borderRadius: '16px',
                        background: 'rgba(20, 20, 25, 0.98)',
                        backdropFilter: 'blur(20px)',
                        border: '1px solid rgba(255, 255, 255, 0.1)',
                        boxShadow: '0 16px 48px rgba(0, 0, 0, 0.5)',
                        zIndex: 50,
                      }}
                    >
                      {/* Header */}
                      <div
                        style={{
                          padding: '16px 18px',
                          borderBottom: '1px solid rgba(255, 255, 255, 0.06)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                        }}
                      >
                        <div>
                          <h3 style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-main)', marginBottom: '2px' }}>
                            Up Next
                          </h3>
                          <p style={{ fontSize: '11px', color: 'var(--text-dim)' }}>
                            {STAGES.length - project.stageIndex} stages remaining
                          </p>
                        </div>
                        <button
                          onClick={() => setIsQueueOpen(false)}
                          style={{
                            width: '28px',
                            height: '28px',
                            borderRadius: '8px',
                            border: 'none',
                            background: 'rgba(255, 255, 255, 0.06)',
                            color: 'var(--text-dim)',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                          }}
                        >
                          <X style={{ width: '14px', height: '14px' }} />
                        </button>
                      </div>

                      {/* Now Playing */}
                      {(() => {
                        const currentStage = STAGES[project.stageIndex];
                        const currentDeliverableNames: Record<string, string> = {
                          intake: 'Project Brief',
                          research: 'Research Report',
                          spec: 'Product Spec',
                          architecture: 'Architecture Doc',
                          design: 'Design Mockups',
                          testReport: 'Test Report',
                          securityReport: 'Security Audit',
                          documentation: 'Documentation',
                        };
                        const currentDeliverable = currentStage?.deliverableKey
                          ? currentDeliverableNames[currentStage.deliverableKey]
                          : null;

                        return (
                          <div
                            style={{
                              padding: '16px 18px',
                              background: 'linear-gradient(135deg, rgba(255, 107, 53, 0.1) 0%, rgba(255, 107, 53, 0.05) 100%)',
                              borderBottom: '1px solid rgba(255, 255, 255, 0.06)',
                            }}
                          >
                            <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '12px' }}>
                              <div
                                style={{
                                  width: '6px',
                                  height: '6px',
                                  borderRadius: '50%',
                                  background: isRunning ? '#22c55e' : isPaused ? '#f59e0b' : 'var(--text-dim)',
                                  animation: isRunning ? 'pulse 1.5s ease-in-out infinite' : 'none',
                                }}
                              />
                              <span style={{ fontSize: '10px', color: isRunning ? '#22c55e' : isPaused ? '#f59e0b' : 'var(--text-dim)', fontWeight: 600, letterSpacing: '0.05em' }}>
                                {isRunning ? 'NOW PLAYING' : isPaused ? 'PAUSED' : 'READY TO START'}
                              </span>
                            </div>

                            {/* Agent and stage info */}
                            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', marginBottom: '12px' }}>
                              <div
                                style={{
                                  width: '44px',
                                  height: '44px',
                                  borderRadius: '12px',
                                  background: isRunning
                                    ? 'linear-gradient(135deg, var(--accent) 0%, var(--accent-secondary) 100%)'
                                    : 'rgba(255, 255, 255, 0.08)',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  flexShrink: 0,
                                }}
                              >
                                <StageIcon name={currentStage?.icon} style={{ width: '22px', height: '22px', color: isRunning ? 'white' : 'var(--text-secondary)' }} />
                              </div>
                              <div style={{ flex: 1, minWidth: 0 }}>
                                <p style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-main)', marginBottom: '4px' }}>
                                  {currentStage?.agent}
                                </p>
                                <p style={{ fontSize: '11px', color: 'var(--text-secondary)', marginBottom: '2px' }}>
                                  Stage {project.stageIndex + 1}: {currentStage?.name.split('. ')[1]}
                                </p>
                              </div>
                              {isRunning ? (
                                <Pause style={{ width: '20px', height: '20px', color: 'var(--accent)', marginTop: '2px' }} />
                              ) : (
                                <Play style={{ width: '20px', height: '20px', color: 'var(--text-dim)', marginTop: '2px' }} />
                              )}
                            </div>

                            {/* Task description */}
                            <p style={{ fontSize: '11px', color: 'var(--text-secondary)', lineHeight: 1.5, marginBottom: '10px' }}>
                              {currentTask?.currentStep || currentStage?.description}
                            </p>

                            {/* Progress Bar */}
                            {(isRunning || isPaused) && currentTask && (
                              <div style={{ marginBottom: '12px' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                                  <span style={{ fontSize: '10px', color: 'var(--text-dim)' }}>
                                    {currentTask.currentStep || 'Processing...'}
                                  </span>
                                  <span style={{ fontSize: '10px', color: 'var(--text-dim)', fontFamily: 'monospace' }}>
                                    {currentTask.progress}%
                                  </span>
                                </div>
                                <div
                                  style={{
                                    height: '4px',
                                    background: 'rgba(255, 255, 255, 0.1)',
                                    borderRadius: '2px',
                                    overflow: 'hidden',
                                  }}
                                >
                                  <motion.div
                                    style={{
                                      height: '100%',
                                      background: 'var(--accent)',
                                      borderRadius: '2px',
                                    }}
                                    initial={{ width: 0 }}
                                    animate={{ width: `${currentTask.progress}%` }}
                                    transition={{ duration: 0.3 }}
                                  />
                                </div>
                              </div>
                            )}

                            {/* Deliverable badge */}
                            {currentDeliverable && (
                              <div
                                style={{
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: '6px',
                                  padding: '6px 10px',
                                  borderRadius: '6px',
                                  background: 'rgba(255, 255, 255, 0.06)',
                                  marginBottom: '12px',
                                }}
                              >
                                <FileText style={{ width: '12px', height: '12px', color: 'var(--accent)' }} />
                                <span style={{ fontSize: '11px', color: 'var(--text-main)', fontWeight: 500 }}>
                                  Producing: {currentDeliverable}
                                </span>
                              </div>
                            )}

                            {/* Playback Controls */}
                            {(isRunning || isPaused) && (
                              <div
                                style={{
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  gap: '8px',
                                  paddingTop: '12px',
                                  borderTop: '1px solid rgba(255, 255, 255, 0.06)',
                                }}
                              >
                                {/* Restart */}
                                <button
                                  onClick={(e) => { e.stopPropagation(); handleRestart(); }}
                                  style={{
                                    width: '36px',
                                    height: '36px',
                                    borderRadius: '8px',
                                    border: 'none',
                                    background: 'rgba(255, 255, 255, 0.06)',
                                    color: 'var(--text-secondary)',
                                    cursor: 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    transition: 'all 0.15s ease',
                                  }}
                                  onMouseEnter={(e) => {
                                    e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)';
                                    e.currentTarget.style.color = 'var(--text-main)';
                                  }}
                                  onMouseLeave={(e) => {
                                    e.currentTarget.style.background = 'rgba(255, 255, 255, 0.06)';
                                    e.currentTarget.style.color = 'var(--text-secondary)';
                                  }}
                                  title="Restart stage"
                                >
                                  <SkipBack style={{ width: '16px', height: '16px' }} />
                                </button>

                                {/* Play/Pause */}
                                <button
                                  onClick={(e) => { e.stopPropagation(); handlePauseResume(); }}
                                  style={{
                                    width: '44px',
                                    height: '44px',
                                    borderRadius: '50%',
                                    border: 'none',
                                    background: isRunning ? 'var(--accent)' : 'rgba(255, 255, 255, 0.1)',
                                    color: isRunning ? 'white' : 'var(--accent)',
                                    cursor: 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    transition: 'all 0.15s ease',
                                  }}
                                  title={isRunning ? 'Pause' : 'Resume'}
                                >
                                  {isRunning ? (
                                    <Pause style={{ width: '20px', height: '20px' }} />
                                  ) : (
                                    <Play style={{ width: '20px', height: '20px', marginLeft: '2px' }} />
                                  )}
                                </button>

                                {/* Skip */}
                                <button
                                  onClick={(e) => { e.stopPropagation(); handleSkip(); }}
                                  style={{
                                    width: '36px',
                                    height: '36px',
                                    borderRadius: '8px',
                                    border: 'none',
                                    background: 'rgba(255, 255, 255, 0.06)',
                                    color: 'var(--text-secondary)',
                                    cursor: 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    transition: 'all 0.15s ease',
                                  }}
                                  onMouseEnter={(e) => {
                                    e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)';
                                    e.currentTarget.style.color = 'var(--text-main)';
                                  }}
                                  onMouseLeave={(e) => {
                                    e.currentTarget.style.background = 'rgba(255, 255, 255, 0.06)';
                                    e.currentTarget.style.color = 'var(--text-secondary)';
                                  }}
                                  title="Skip to next stage"
                                >
                                  <SkipForward style={{ width: '16px', height: '16px' }} />
                                </button>

                                {/* Stop */}
                                <button
                                  onClick={(e) => { e.stopPropagation(); handleStop(); }}
                                  style={{
                                    width: '36px',
                                    height: '36px',
                                    borderRadius: '8px',
                                    border: 'none',
                                    background: 'rgba(255, 255, 255, 0.06)',
                                    color: 'var(--text-secondary)',
                                    cursor: 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    transition: 'all 0.15s ease',
                                  }}
                                  onMouseEnter={(e) => {
                                    e.currentTarget.style.background = 'rgba(239, 68, 68, 0.2)';
                                    e.currentTarget.style.color = '#ef4444';
                                  }}
                                  onMouseLeave={(e) => {
                                    e.currentTarget.style.background = 'rgba(255, 255, 255, 0.06)';
                                    e.currentTarget.style.color = 'var(--text-secondary)';
                                  }}
                                  title="Stop pipeline"
                                >
                                  <Square style={{ width: '14px', height: '14px' }} />
                                </button>
                              </div>
                            )}

                            {/* Start button when pipeline is not running */}
                            {!isRunning && !isPaused && (
                              <button
                                onClick={(e) => { e.stopPropagation(); handleKickOff(); }}
                                disabled={isKickingOff}
                                style={{
                                  width: '100%',
                                  padding: '12px',
                                  borderRadius: '10px',
                                  border: 'none',
                                  background: 'linear-gradient(135deg, var(--accent) 0%, var(--accent-secondary) 100%)',
                                  color: 'white',
                                  fontSize: '13px',
                                  fontWeight: 600,
                                  cursor: isKickingOff ? 'not-allowed' : 'pointer',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  gap: '8px',
                                  marginTop: '8px',
                                  opacity: isKickingOff ? 0.7 : 1,
                                }}
                              >
                                {isKickingOff ? (
                                  <>
                                    <Loader2 style={{ width: '16px', height: '16px', animation: 'spin 1s linear infinite' }} />
                                    Starting...
                                  </>
                                ) : (
                                  <>
                                    <Zap style={{ width: '16px', height: '16px' }} />
                                    Start Pipeline
                                  </>
                                )}
                              </button>
                            )}
                          </div>
                        );
                      })()}

                      {/* Queue List */}
                      <div style={{ padding: '8px 0' }}>
                        {STAGES.slice(project.stageIndex + 1).map((stage, idx) => {
                          // Get deliverable name for this stage
                          const deliverableNames: Record<string, string> = {
                            intake: 'Project Brief',
                            research: 'Research Report',
                            spec: 'Product Spec',
                            architecture: 'Architecture Doc',
                            design: 'Design Mockups',
                            testReport: 'Test Report',
                            securityReport: 'Security Audit',
                            documentation: 'Documentation',
                          };
                          const deliverableName = stage.deliverableKey
                            ? deliverableNames[stage.deliverableKey]
                            : null;

                          return (
                            <motion.div
                              key={stage.name}
                              initial={{ opacity: 0, x: -10 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ delay: idx * 0.03 }}
                              style={{
                                padding: '14px 18px',
                                cursor: 'pointer',
                                transition: 'background 0.15s ease',
                                borderBottom: idx < STAGES.length - project.stageIndex - 2 ? '1px solid rgba(255, 255, 255, 0.04)' : 'none',
                              }}
                              onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.04)'}
                              onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                              onClick={() => {
                                setSelectedStage(project.stageIndex + 1 + idx);
                                setIsQueueOpen(false);
                              }}
                            >
                              {/* Order number and agent */}
                              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
                                <span
                                  style={{
                                    fontSize: '10px',
                                    color: 'var(--text-muted)',
                                    width: '18px',
                                    height: '18px',
                                    borderRadius: '4px',
                                    background: 'rgba(255, 255, 255, 0.06)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    fontWeight: 600,
                                  }}
                                >
                                  {idx + 1}
                                </span>
                                <div
                                  style={{
                                    width: '24px',
                                    height: '24px',
                                    borderRadius: '6px',
                                    background: 'rgba(255, 255, 255, 0.08)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    flexShrink: 0,
                                  }}
                                >
                                  <StageIcon name={stage.icon} style={{ width: '12px', height: '12px', color: 'var(--text-secondary)' }} />
                                </div>
                                <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-main)' }}>
                                  {stage.agent}
                                </span>
                              </div>

                              {/* Task description */}
                              <div style={{ paddingLeft: '28px' }}>
                                <p style={{ fontSize: '11px', color: 'var(--text-secondary)', lineHeight: 1.4, marginBottom: '6px' }}>
                                  {stage.description}
                                </p>

                                {/* Deliverable badge */}
                                {deliverableName && (
                                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                    <FileText style={{ width: '10px', height: '10px', color: 'var(--text-muted)' }} />
                                    <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>
                                      Produces: {deliverableName}
                                    </span>
                                  </div>
                                )}
                              </div>
                            </motion.div>
                          );
                        })}

                        {/* Empty state if no remaining stages */}
                        {STAGES.length - project.stageIndex <= 1 && (
                          <div style={{ padding: '24px 18px', textAlign: 'center' }}>
                            <Check style={{ width: '24px', height: '24px', color: '#22c55e', margin: '0 auto 8px' }} />
                            <p style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                              Almost there! This is the final stage.
                            </p>
                          </div>
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>

            {/* Progress track */}
            <div className="relative" style={{ padding: '0 20px' }}>
              {/* Background line */}
              <div
                className="absolute"
                style={{
                  top: '28px',
                  left: '60px',
                  right: '60px',
                  height: '3px',
                  background: 'rgba(255, 255, 255, 0.06)',
                  borderRadius: '2px',
                }}
              />
              {/* Progress line */}
              <motion.div
                className="absolute"
                initial={{ width: 0 }}
                animate={{ width: `${(project.stageIndex / (STAGES.length - 1)) * 100}%` }}
                transition={{ duration: 0.8, ease: [0.4, 0, 0.2, 1] }}
                style={{
                  top: '28px',
                  left: '60px',
                  maxWidth: 'calc(100% - 120px)',
                  height: '3px',
                  background: 'linear-gradient(90deg, var(--accent), var(--accent-secondary))',
                  borderRadius: '2px',
                  boxShadow: '0 0 12px rgba(255, 107, 53, 0.4)',
                }}
              />

              {/* Stage nodes */}
              <div className="relative flex justify-between">
                {STAGES.map((stage, idx) => {
                  const isCompleted = idx < project.stageIndex;
                  const isCurrent = idx === project.stageIndex;
                  const hasDeliverable = stage.deliverableKey &&
                    project.deliverables[stage.deliverableKey as keyof typeof project.deliverables];
                  // Agent is "working" only when execution engine is actually running
                  const isAgentWorking = isCurrent && isRunning;

                  return (
                    <StageNode
                      key={stage.name}
                      stage={stage}
                      index={idx}
                      isCompleted={isCompleted}
                      isCurrent={isCurrent}
                      hasDeliverable={!!hasDeliverable}
                      isBlocked={isCurrent && (project.status === 'Blocked' || isPaused)}
                      isWorking={isAgentWorking}
                      onClick={() => setSelectedStage(idx)}
                    />
                  );
                })}
              </div>
            </div>
          </motion.section>

          {/* Two Column Layout */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 360px', gap: '24px' }}>
            {/* Deliverables List */}
            <motion.section
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              style={{
                borderRadius: '24px',
                background: 'rgba(255, 255, 255, 0.015)',
                border: '1px solid rgba(255, 255, 255, 0.06)',
                overflow: 'hidden',
              }}
            >
              <div style={{ padding: '24px 28px', borderBottom: '1px solid rgba(255, 255, 255, 0.06)' }}>
                <h2 style={{ fontSize: '18px', fontWeight: 600, color: 'var(--text-main)', marginBottom: '4px' }}>
                  Deliverables
                </h2>
                <p style={{ fontSize: '13px', color: 'var(--text-dim)' }}>
                  Documents and artifacts from each stage
                </p>
              </div>

              <div>
                {STAGES.filter(s => s.deliverableKey).map((stage, idx) => {
                  const stageIdx = STAGES.findIndex(s => s.name === stage.name);
                  const isCompleted = stageIdx < project.stageIndex;
                  const isCurrent = stageIdx === project.stageIndex;
                  const deliverableUrl = project.deliverables[stage.deliverableKey as keyof typeof project.deliverables];

                  return (
                    <DeliverableRow
                      key={stage.name}
                      stage={stage}
                      isCompleted={isCompleted}
                      isCurrent={isCurrent}
                      deliverableUrl={deliverableUrl}
                      index={idx}
                    />
                  );
                })}
              </div>
            </motion.section>

            {/* Sidebar */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              {/* Stats Cards */}
              <StatCard
                icon={Target}
                label="Stages Completed"
                value={`${project.stageIndex} / ${STAGES.length}`}
                color="var(--accent)"
                delay={0.3}
              />
              <StatCard
                icon={Clock}
                label="Task Progress"
                value={`${Math.round(project.progress * 100)}%`}
                color="#3b82f6"
                delay={0.35}
              />
              <StatCard
                icon={Users}
                label="Current Agent"
                value={project.agent.split(' ')[0]}
                color="#22c55e"
                delay={0.4}
              />

              {/* Notes Card */}
              {project.notes && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.45 }}
                  style={{
                    padding: '20px',
                    borderRadius: '16px',
                    background: 'rgba(255, 255, 255, 0.02)',
                    border: '1px solid rgba(255, 255, 255, 0.06)',
                  }}
                >
                  <p style={{ fontSize: '11px', color: 'var(--text-dim)', marginBottom: '10px', letterSpacing: '0.04em', textTransform: 'uppercase' }}>
                    Notes
                  </p>
                  <p style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                    {project.notes}
                  </p>
                </motion.div>
              )}

              {/* Dev Links */}
              {(project.githubUrl || project.deployUrl) && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5 }}
                  style={{
                    padding: '20px',
                    borderRadius: '16px',
                    background: 'rgba(255, 255, 255, 0.02)',
                    border: '1px solid rgba(255, 255, 255, 0.06)',
                  }}
                >
                  <p style={{ fontSize: '11px', color: 'var(--text-dim)', marginBottom: '14px', letterSpacing: '0.04em', textTransform: 'uppercase' }}>
                    Development
                  </p>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    {project.githubUrl && (
                      <a
                        href={project.githubUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '12px',
                          padding: '12px 14px',
                          borderRadius: '12px',
                          background: 'rgba(168, 85, 247, 0.08)',
                          border: '1px solid rgba(168, 85, 247, 0.15)',
                          color: '#a855f7',
                          textDecoration: 'none',
                          fontSize: '13px',
                          fontWeight: 500,
                          transition: 'all 0.2s ease',
                        }}
                      >
                        <Github style={{ width: '18px', height: '18px' }} />
                        <span style={{ flex: 1 }}>Repository</span>
                        <ExternalLink style={{ width: '14px', height: '14px', opacity: 0.6 }} />
                      </a>
                    )}
                    {project.deployUrl && (
                      <a
                        href={project.deployUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '12px',
                          padding: '12px 14px',
                          borderRadius: '12px',
                          background: 'rgba(34, 197, 94, 0.08)',
                          border: '1px solid rgba(34, 197, 94, 0.15)',
                          color: '#22c55e',
                          textDecoration: 'none',
                          fontSize: '13px',
                          fontWeight: 500,
                          transition: 'all 0.2s ease',
                        }}
                      >
                        <Globe style={{ width: '18px', height: '18px' }} />
                        <span style={{ flex: 1 }}>Live Site</span>
                        <ExternalLink style={{ width: '14px', height: '14px', opacity: 0.6 }} />
                      </a>
                    )}
                  </div>
                </motion.div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Stage Detail Modal */}
      {selectedStage !== null && (
        <StageDetailModal
          project={project}
          stageIndex={selectedStage}
          onClose={() => setSelectedStage(null)}
        />
      )}

      {/* Edit Project Modal */}
      {isEditModalOpen && (
        <EditProjectModal
          project={project}
          onClose={() => setIsEditModalOpen(false)}
          onSave={handleSaveProject}
        />
      )}
    </div>
  );
}
