'use client'

import { useState, useCallback, useMemo, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { motion, AnimatePresence } from 'motion/react'
import { useDashboardStore } from '@/lib/store'
import { useSupabase } from '@/components/providers/SupabaseProvider'
import { generateId } from '@/lib/utils'
import type { Project, BriefingAnswers, BriefingQuestion, GeneratedBriefingOptions, CEOProposal, Task } from '@/lib/types'

// Project-specific clarifying questions shown one at a time
const BRIEFING_QUESTIONS: BriefingQuestion[] = [
  {
    key: 'projectDescription',
    question: 'Describe your project in one sentence',
    placeholder: 'e.g., A mobile app that helps busy parents plan healthy meals for their family',
    hint: 'Be specific about what you\'re building',
    isMultipleChoice: false,
  },
  {
    key: 'targetAudience',
    question: 'Who is your target audience?',
    placeholder: 'Enter your own answer...',
    hint: 'Select the best fit or write your own',
    isMultipleChoice: true,
  },
  {
    key: 'problemToSolve',
    question: 'What problem are you solving?',
    placeholder: 'Enter your own answer...',
    hint: 'Select the best fit or write your own',
    isMultipleChoice: true,
  },
  {
    key: 'keyFeature',
    question: 'What\'s the one feature that must work perfectly?',
    placeholder: 'Enter your own answer...',
    hint: 'Select the best fit or write your own',
    isMultipleChoice: true,
  },
  {
    key: 'successCriteria',
    question: 'How will you know if this succeeds?',
    placeholder: 'Enter your own answer...',
    hint: 'Select the best fit or write your own',
    isMultipleChoice: true,
  },
]

const PROJECT_COLORS = [
  { hex: '#6366f1', name: 'Indigo' },
  { hex: '#8b5cf6', name: 'Violet' },
  { hex: '#ec4899', name: 'Pink' },
  { hex: '#f43f5e', name: 'Rose' },
  { hex: '#ff6b35', name: 'Orange' },
  { hex: '#eab308', name: 'Amber' },
  { hex: '#22c55e', name: 'Emerald' },
  { hex: '#14b8a6', name: 'Teal' },
  { hex: '#06b6d4', name: 'Cyan' },
  { hex: '#3b82f6', name: 'Blue' },
]

interface NewProjectWizardProps {
  onClose: () => void
}

type WizardStep = 'name' | 'color' | 'type' | 'briefing' | 'proposal' | 'launching'

// Floating particles background
function ParticleField({ color }: { color: string }) {
  return (
    <div style={{
      position: 'absolute',
      inset: 0,
      overflow: 'hidden',
      pointerEvents: 'none',
    }}>
      {Array.from({ length: 30 }).map((_, i) => (
        <motion.div
          key={i}
          initial={{
            x: `${Math.random() * 100}%`,
            y: `${Math.random() * 100}%`,
            scale: Math.random() * 0.5 + 0.5,
            opacity: 0,
          }}
          animate={{
            y: [`${Math.random() * 100}%`, `${Math.random() * 100}%`],
            opacity: [0, 0.3, 0],
          }}
          transition={{
            duration: Math.random() * 20 + 15,
            repeat: Infinity,
            ease: 'linear',
            delay: Math.random() * 5,
          }}
          style={{
            position: 'absolute',
            width: '4px',
            height: '4px',
            borderRadius: '50%',
            backgroundColor: color,
            filter: 'blur(1px)',
          }}
        />
      ))}
    </div>
  )
}

// Large step number indicator
function StepNumber({ step, total, color }: { step: number; total: number; color: string }) {
  return (
    <div style={{
      position: 'absolute',
      top: '40px',
      left: '50%',
      transform: 'translateX(-50%)',
      display: 'flex',
      alignItems: 'center',
      gap: '12px',
    }}>
      <span style={{
        fontSize: '12px',
        fontFamily: 'var(--font-mono, ui-monospace, monospace)',
        letterSpacing: '0.2em',
        textTransform: 'uppercase',
        color: 'var(--text-dim)',
      }}>
        Step
      </span>
      <div style={{
        display: 'flex',
        alignItems: 'baseline',
        gap: '4px',
      }}>
        <motion.span
          key={step}
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          style={{
            fontSize: '28px',
            fontWeight: 700,
            fontFamily: 'var(--font-mono, ui-monospace, monospace)',
            color: color,
          }}
        >
          {step}
        </motion.span>
        <span style={{
          fontSize: '14px',
          fontFamily: 'var(--font-mono, ui-monospace, monospace)',
          color: 'var(--text-dim)',
        }}>
          / {total}
        </span>
      </div>
    </div>
  )
}

// Progress bar at top
function ProgressBar({ progress, color }: { progress: number; color: string }) {
  return (
    <div style={{
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      height: '3px',
      backgroundColor: 'rgba(255, 255, 255, 0.05)',
    }}>
      <motion.div
        initial={{ width: 0 }}
        animate={{ width: `${progress}%` }}
        transition={{ duration: 0.5, ease: [0.4, 0, 0.2, 1] }}
        style={{
          height: '100%',
          backgroundColor: color,
          boxShadow: `0 0 20px ${color}`,
        }}
      />
    </div>
  )
}

// Large color picker for fullscreen
function FullscreenColorPicker({
  selected,
  onChange,
}: {
  selected: string
  onChange: (color: string) => void
}) {
  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: 'repeat(5, 1fr)',
      gap: '20px',
      maxWidth: '400px',
    }}>
      {PROJECT_COLORS.map(({ hex, name }) => {
        const isSelected = selected === hex

        return (
          <motion.button
            key={hex}
            onClick={() => onChange(hex)}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
            style={{
              width: '60px',
              height: '60px',
              borderRadius: '16px',
              border: 'none',
              cursor: 'pointer',
              position: 'relative',
              backgroundColor: hex,
              boxShadow: isSelected
                ? `0 0 0 3px #0a0a0a, 0 0 0 6px ${hex}, 0 8px 32px ${hex}60`
                : `0 4px 20px ${hex}30`,
            }}
            title={name}
          >
            <AnimatePresence>
              {isSelected && (
                <motion.div
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0, opacity: 0 }}
                  style={{
                    position: 'absolute',
                    inset: 0,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#0a0a0a" strokeWidth="3">
                    <path d="M5 13l4 4L19 7" />
                  </svg>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.button>
        )
      })}
    </div>
  )
}

// Project type card for fullscreen
function ProjectTypeCard({
  title,
  subtitle,
  icon,
  isSelected,
  onClick,
  color,
  recommended,
}: {
  title: string
  subtitle: string
  icon: React.ReactNode
  isSelected: boolean
  onClick: () => void
  color: string
  recommended?: boolean
}) {
  return (
    <motion.button
      onClick={onClick}
      whileHover={{ scale: 1.02, y: -4 }}
      whileTap={{ scale: 0.98 }}
      style={{
        width: '280px',
        padding: '32px',
        borderRadius: '24px',
        border: `2px solid ${isSelected ? color : 'rgba(255, 255, 255, 0.08)'}`,
        backgroundColor: isSelected ? `${color}10` : 'rgba(255, 255, 255, 0.02)',
        cursor: 'pointer',
        textAlign: 'left',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {isSelected && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          style={{
            position: 'absolute',
            top: '-100px',
            left: '-100px',
            width: '300px',
            height: '300px',
            background: `radial-gradient(circle, ${color}15 0%, transparent 70%)`,
            pointerEvents: 'none',
          }}
        />
      )}

      <div style={{ position: 'relative' }}>
        {recommended && (
          <div style={{
            position: 'absolute',
            top: '-8px',
            right: '-8px',
            fontSize: '9px',
            fontFamily: 'var(--font-mono, ui-monospace, monospace)',
            letterSpacing: '0.1em',
            textTransform: 'uppercase',
            color: color,
            padding: '6px 10px',
            backgroundColor: `${color}20`,
            borderRadius: '8px',
          }}>
            Recommended
          </div>
        )}

        <div style={{
          width: '56px',
          height: '56px',
          borderRadius: '16px',
          backgroundColor: isSelected ? color : 'rgba(255, 255, 255, 0.06)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: '20px',
          color: isSelected ? '#0a0a0a' : 'var(--text-dim)',
          transition: 'all 0.2s ease',
        }}>
          {icon}
        </div>

        <h3 style={{
          fontSize: '18px',
          fontWeight: 600,
          color: 'var(--text-main)',
          marginBottom: '8px',
        }}>
          {title}
        </h3>

        <p style={{
          fontSize: '14px',
          color: 'var(--text-dim)',
          lineHeight: 1.5,
        }}>
          {subtitle}
        </p>
      </div>
    </motion.button>
  )
}

// Phase timeline for proposal
function ProposalTimeline({
  phases,
  color,
}: {
  phases: CEOProposal['phases']
  color: string
}) {
  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      gap: '16px',
      maxWidth: '500px',
    }}>
      {phases.map((phase, i) => (
        <motion.div
          key={i}
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: i * 0.1 }}
          style={{
            display: 'flex',
            alignItems: 'flex-start',
            gap: '16px',
          }}
        >
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '4px',
          }}>
            <div style={{
              width: '12px',
              height: '12px',
              borderRadius: '4px',
              backgroundColor: i === 0 ? color : 'rgba(255, 255, 255, 0.1)',
              boxShadow: i === 0 ? `0 0 16px ${color}` : 'none',
            }} />
            {i < phases.length - 1 && (
              <div style={{
                width: '2px',
                height: '40px',
                backgroundColor: 'rgba(255, 255, 255, 0.08)',
              }} />
            )}
          </div>

          <div style={{ flex: 1, paddingBottom: '8px' }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: '4px',
            }}>
              <span style={{
                fontSize: '15px',
                fontWeight: 600,
                color: 'var(--text-main)',
              }}>
                {phase.name}
              </span>
              <span style={{
                fontSize: '12px',
                fontFamily: 'var(--font-mono, ui-monospace, monospace)',
                color: color,
                padding: '4px 10px',
                backgroundColor: `${color}15`,
                borderRadius: '6px',
              }}>
                {phase.duration}
              </span>
            </div>
            <p style={{
              fontSize: '13px',
              color: 'var(--text-dim)',
              lineHeight: 1.4,
              margin: 0,
            }}>
              {phase.description}
            </p>
          </div>
        </motion.div>
      ))}
    </div>
  )
}

// Launch screen
function LaunchScreen({ color, projectName }: { color: string; projectName: string }) {
  const [progress, setProgress] = useState(0)

  useEffect(() => {
    const interval = setInterval(() => {
      setProgress(prev => Math.min(prev + Math.random() * 15, 100))
    }, 200)
    return () => clearInterval(interval)
  }, [])

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      height: '100%',
      textAlign: 'center',
    }}>
      {/* Animated launch icon */}
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        style={{
          width: '120px',
          height: '120px',
          borderRadius: '32px',
          backgroundColor: color,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: '40px',
          position: 'relative',
        }}
      >
        {/* Pulse rings */}
        {[0, 1, 2].map((i) => (
          <motion.div
            key={i}
            initial={{ scale: 1, opacity: 0.6 }}
            animate={{ scale: 3, opacity: 0 }}
            transition={{
              duration: 2.5,
              repeat: Infinity,
              delay: i * 0.8,
              ease: 'easeOut',
            }}
            style={{
              position: 'absolute',
              inset: 0,
              borderRadius: '32px',
              border: `2px solid ${color}`,
            }}
          />
        ))}

        <motion.svg
          width="48"
          height="48"
          viewBox="0 0 24 24"
          fill="none"
          stroke="#0a0a0a"
          strokeWidth="2"
          animate={{ y: [0, -4, 0] }}
          transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
        >
          <path d="M12 2L4 8v8l8 6 8-6V8l-8-6z" />
          <path d="M12 22v-6" />
        </motion.svg>
      </motion.div>

      <motion.h1
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        style={{
          fontSize: '36px',
          fontWeight: 600,
          color: 'var(--text-main)',
          marginBottom: '12px',
        }}
      >
        Launching {projectName}
      </motion.h1>

      <motion.p
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        style={{
          fontSize: '16px',
          color: 'var(--text-dim)',
          fontFamily: 'var(--font-mono, ui-monospace, monospace)',
          marginBottom: '48px',
        }}
      >
        Initializing pipeline and assigning tasks...
      </motion.p>

      {/* Progress bar */}
      <motion.div
        initial={{ opacity: 0, width: 0 }}
        animate={{ opacity: 1, width: '300px' }}
        transition={{ delay: 0.4 }}
        style={{
          height: '6px',
          backgroundColor: 'rgba(255, 255, 255, 0.08)',
          borderRadius: '3px',
          overflow: 'hidden',
        }}
      >
        <motion.div
          animate={{ width: `${progress}%` }}
          style={{
            height: '100%',
            backgroundColor: color,
            borderRadius: '3px',
            boxShadow: `0 0 20px ${color}`,
          }}
        />
      </motion.div>

      <motion.span
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
        style={{
          marginTop: '16px',
          fontSize: '13px',
          fontFamily: 'var(--font-mono, ui-monospace, monospace)',
          color: 'var(--text-dim)',
        }}
      >
        {Math.round(progress)}%
      </motion.span>
    </div>
  )
}

// Navigation button
function NavButton({
  children,
  onClick,
  variant = 'secondary',
  color,
  disabled,
}: {
  children: React.ReactNode
  onClick: () => void
  variant?: 'primary' | 'secondary'
  color: string
  disabled?: boolean
}) {
  return (
    <motion.button
      onClick={onClick}
      disabled={disabled}
      whileHover={disabled ? {} : { scale: 1.02 }}
      whileTap={disabled ? {} : { scale: 0.98 }}
      style={{
        padding: variant === 'primary' ? '16px 40px' : '16px 28px',
        borderRadius: '14px',
        border: variant === 'primary' ? 'none' : '1px solid rgba(255, 255, 255, 0.1)',
        backgroundColor: variant === 'primary'
          ? (disabled ? 'rgba(255, 255, 255, 0.05)' : color)
          : 'transparent',
        color: variant === 'primary'
          ? (disabled ? 'var(--text-dim)' : '#0a0a0a')
          : 'var(--text-secondary)',
        fontSize: '15px',
        fontWeight: 600,
        cursor: disabled ? 'not-allowed' : 'pointer',
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        boxShadow: variant === 'primary' && !disabled ? `0 8px 32px ${color}50` : 'none',
      }}
    >
      {children}
    </motion.button>
  )
}

export function NewProjectWizard({ onClose }: NewProjectWizardProps) {
  const [step, setStep] = useState<WizardStep>('name')
  const [briefingQuestionIndex, setBriefingQuestionIndex] = useState(0)

  // Form state
  const [name, setName] = useState('')
  const [color, setColor] = useState(PROJECT_COLORS[4].hex)
  const [projectType, setProjectType] = useState<'quick' | 'ceo_orchestrated'>('ceo_orchestrated')
  const [briefingAnswers, setBriefingAnswers] = useState<BriefingAnswers>({})
  const [proposal, setProposal] = useState<CEOProposal | null>(null)

  // AI-generated options for multiple choice questions
  const [generatedOptions, setGeneratedOptions] = useState<GeneratedBriefingOptions | null>(null)
  const [isLoadingOptions, setIsLoadingOptions] = useState(false)
  const [showCustomInput, setShowCustomInput] = useState(false)

  // Current briefing question
  const currentBriefingQuestion = BRIEFING_QUESTIONS[briefingQuestionIndex]
  const currentBriefingAnswer = currentBriefingQuestion ? briefingAnswers[currentBriefingQuestion.key] || '' : ''
  const isLastBriefingQuestion = briefingQuestionIndex === BRIEFING_QUESTIONS.length - 1

  // Get options for current multiple choice question
  const currentOptions = useMemo(() => {
    if (!generatedOptions || !currentBriefingQuestion?.isMultipleChoice) return []
    const key = currentBriefingQuestion.key as keyof GeneratedBriefingOptions
    return generatedOptions[key] || []
  }, [generatedOptions, currentBriefingQuestion])

  // Fetch AI-generated options after first question
  const fetchGeneratedOptions = useCallback(async (projectDescription: string) => {
    setIsLoadingOptions(true)
    try {
      const response = await fetch('/api/briefing-options', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ projectDescription, projectName: name }),
      })
      const options = await response.json()
      setGeneratedOptions(options)
    } catch (error) {
      console.error('Failed to fetch options:', error)
      // Fallback options will be used from the API
    } finally {
      setIsLoadingOptions(false)
    }
  }, [name])

  const { addProject, setActiveProject, addTask } = useDashboardStore()
  const { saveProject, isConfigured } = useSupabase()

  // Calculate step number and total (briefing has sub-steps)
  const stepConfig = useMemo(() => {
    if (projectType === 'quick') {
      return {
        steps: ['name', 'color', 'type'] as WizardStep[],
        total: 3,
      }
    }
    // For CEO orchestrated: 3 setup steps + 5 briefing questions + 1 proposal = 9 total
    return {
      steps: ['name', 'color', 'type', 'briefing', 'proposal'] as WizardStep[],
      total: 3 + BRIEFING_QUESTIONS.length + 1,
    }
  }, [projectType])

  // Calculate current step number accounting for briefing sub-steps
  const currentStepNumber = useMemo(() => {
    const baseStepIndex = stepConfig.steps.indexOf(step)
    if (step === 'briefing') {
      return 4 + briefingQuestionIndex // Step 4, 5, 6, 7, 8 for each briefing question
    }
    if (step === 'proposal') {
      return 3 + BRIEFING_QUESTIONS.length + 1 // Final step
    }
    return baseStepIndex + 1
  }, [step, briefingQuestionIndex, stepConfig.steps])

  const progress = (currentStepNumber / stepConfig.total) * 100

  const generateProposal = useCallback((answers: BriefingAnswers): CEOProposal => {
    // Generate a dynamic proposal based on project-specific answers
    const hasDetailedAnswers = answers.projectDescription && answers.targetAudience && answers.problemToSolve

    const basePhases = [
      {
        name: 'Research',
        duration: '2 days',
        agents: ['product_researcher'] as const,
        description: answers.targetAudience
          ? `Research ${answers.targetAudience} and validate the problem`
          : 'Market research and competitive analysis'
      },
      {
        name: 'Spec & Architecture',
        duration: '2 days',
        agents: ['product_manager', 'architect'] as const,
        description: answers.keyFeature
          ? `Define requirements around "${answers.keyFeature}" and system design`
          : 'Product specification and technical architecture'
      },
      {
        name: 'Design',
        duration: '3 days',
        agents: ['frontend_designer'] as const,
        description: 'UI/UX design and interactive mockups'
      },
      {
        name: 'Development',
        duration: '5 days',
        agents: ['developer', 'devops_engineer'] as const,
        description: answers.keyFeature
          ? `Build core functionality: ${answers.keyFeature}`
          : 'Core development and infrastructure'
      },
      {
        name: 'Testing & QA',
        duration: '2 days',
        agents: ['user_testing', 'code_reviewer'] as const,
        description: answers.successCriteria
          ? `Validate against success criteria: ${answers.successCriteria.substring(0, 50)}...`
          : 'Quality assurance and user testing'
      },
      {
        name: 'Launch',
        duration: '1 day',
        agents: ['growth_marketer', 'technical_writer'] as const,
        description: 'Documentation and launch preparation'
      },
    ]

    const totalDays = basePhases.reduce((acc, phase) => acc + parseInt(phase.duration), 0)
    const uniqueAgents = new Set(basePhases.flatMap(p => p.agents))

    const summaryPrefix = hasDetailedAnswers
      ? `Based on your vision for "${answers.projectDescription?.substring(0, 60)}..."`
      : 'Based on your project requirements'

    return {
      summary: `${summaryPrefix}, I recommend a ${totalDays}-day development plan with ${uniqueAgents.size} agents working in parallel.`,
      phases: basePhases.map(p => ({ ...p, agents: [...p.agents] })),
      totalDuration: `${totalDays} days`,
      agentCount: uniqueAgents.size,
      estimatedTasks: basePhases.length * 3,
    }
  }, [])

  const goNext = useCallback(() => {
    // Handle briefing sub-steps
    if (step === 'briefing') {
      // After first question (project description), fetch AI-generated options
      if (briefingQuestionIndex === 0 && briefingAnswers.projectDescription) {
        fetchGeneratedOptions(briefingAnswers.projectDescription)
      }

      // Reset custom input mode when moving to next question
      setShowCustomInput(false)

      if (briefingQuestionIndex < BRIEFING_QUESTIONS.length - 1) {
        setBriefingQuestionIndex(prev => prev + 1)
        return
      }
      // Move to proposal after last briefing question
      setStep('proposal')
      return
    }

    const currentIndex = stepConfig.steps.indexOf(step)
    if (currentIndex < stepConfig.steps.length - 1) {
      setStep(stepConfig.steps[currentIndex + 1])
    }
  }, [step, briefingQuestionIndex, stepConfig.steps, briefingAnswers.projectDescription, fetchGeneratedOptions])

  const goBack = useCallback(() => {
    // Reset custom input mode when navigating
    setShowCustomInput(false)

    // Handle briefing sub-steps
    if (step === 'briefing') {
      if (briefingQuestionIndex > 0) {
        setBriefingQuestionIndex(prev => prev - 1)
        return
      }
      // Go back to type step from first briefing question
      setStep('type')
      return
    }

    // Go back to last briefing question from proposal
    if (step === 'proposal') {
      setStep('briefing')
      setBriefingQuestionIndex(BRIEFING_QUESTIONS.length - 1)
      return
    }

    const currentIndex = stepConfig.steps.indexOf(step)
    if (currentIndex > 0) {
      setStep(stepConfig.steps[currentIndex - 1])
    }
  }, [step, briefingQuestionIndex, stepConfig.steps])

  const handleCreateProject = useCallback(async () => {
    if (!name.trim()) return

    setStep('launching')

    const project: Project = {
      id: generateId(),
      name: name.trim(),
      status: 'active',
      color,
      projectType,
      briefingAnswers: projectType === 'ceo_orchestrated' ? briefingAnswers : undefined,
      createdAt: new Date(),
      updatedAt: new Date(),
    }

    addProject(project)

    if (projectType === 'ceo_orchestrated' && proposal) {
      const initialTask: Task = {
        id: generateId(),
        title: `Phase 1: ${proposal.phases[0]?.name || 'Research'}`,
        description: proposal.phases[0]?.description || 'Initial project research and analysis',
        status: 'pending',
        priority: 'high',
        assignedTo: 'product_researcher',
        projectId: project.id,
        createdAt: new Date(),
        updatedAt: new Date(),
        streamOutput: [],
        progress: 0,
      }
      addTask(initialTask)
    }

    if (isConfigured) {
      await saveProject(project)
    }

    setTimeout(() => {
      setActiveProject(project.id)
      onClose()
    }, 2500)
  }, [name, color, projectType, briefingAnswers, proposal, addProject, addTask, saveProject, isConfigured, setActiveProject, onClose])

  // Handle keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
      if (e.key === 'Enter' && step === 'name' && name.trim()) goNext()
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [onClose, step, name, goNext])

  // Generate proposal when entering proposal step
  useEffect(() => {
    if (step === 'proposal' && !proposal) {
      setProposal(generateProposal(briefingAnswers))
    }
  }, [step, proposal, briefingAnswers, generateProposal])

  // Use portal to render at document body level, covering everything
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    // Prevent body scroll when wizard is open
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = ''
    }
  }, [])

  if (!mounted) return null

  return createPortal(
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 99999,
        backgroundColor: '#0a0a0a',
      }}
    >
      {/* Ambient background */}
      <div style={{
        position: 'absolute',
        inset: 0,
        background: `
          radial-gradient(ellipse 80% 50% at 50% -20%, ${color}15 0%, transparent 50%),
          radial-gradient(ellipse 60% 40% at 100% 100%, ${color}08 0%, transparent 40%)
        `,
        transition: 'background 0.5s ease',
      }} />

      <ParticleField color={color} />

      {/* Progress bar */}
      {step !== 'launching' && <ProgressBar progress={progress} color={color} />}

      {/* Step indicator */}
      {step !== 'launching' && (
        <StepNumber step={currentStepNumber} total={stepConfig.total} color={color} />
      )}

      {/* Close button */}
      {step !== 'launching' && (
        <motion.button
          onClick={onClose}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          style={{
            position: 'absolute',
            top: '32px',
            right: '32px',
            width: '48px',
            height: '48px',
            borderRadius: '14px',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            backgroundColor: 'rgba(255, 255, 255, 0.03)',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'var(--text-dim)',
          }}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M18 6L6 18M6 6l12 12" />
          </svg>
        </motion.button>
      )}

      {/* Main content area */}
      <div style={{
        position: 'absolute',
        inset: 0,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '120px 40px 140px',
      }}>
        <AnimatePresence mode="wait">
          {/* STEP 1: Name */}
          {step === 'name' && (
            <motion.div
              key="name"
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -40 }}
              transition={{ duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                width: '100%',
                maxWidth: '600px',
              }}
            >
              <h1 style={{
                fontSize: '42px',
                fontWeight: 600,
                color: 'var(--text-main)',
                marginBottom: '16px',
                textAlign: 'center',
              }}>
                What&apos;s your project called?
              </h1>

              <p style={{
                fontSize: '16px',
                color: 'var(--text-dim)',
                marginBottom: '48px',
                textAlign: 'center',
              }}>
                Give your project a memorable name
              </p>

              <motion.input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="My Awesome Project"
                autoFocus
                style={{
                  width: '100%',
                  padding: '24px 32px',
                  fontSize: '24px',
                  fontWeight: 500,
                  backgroundColor: 'rgba(255, 255, 255, 0.03)',
                  border: `2px solid ${name.trim() ? color : 'rgba(255, 255, 255, 0.08)'}`,
                  borderRadius: '20px',
                  color: 'var(--text-main)',
                  outline: 'none',
                  textAlign: 'center',
                  transition: 'border-color 0.2s ease',
                }}
              />

              <p style={{
                marginTop: '24px',
                fontSize: '13px',
                fontFamily: 'var(--font-mono, ui-monospace, monospace)',
                color: 'var(--text-dim)',
              }}>
                Press Enter to continue
              </p>
            </motion.div>
          )}

          {/* STEP 2: Color */}
          {step === 'color' && (
            <motion.div
              key="color"
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -40 }}
              transition={{ duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
              }}
            >
              <h1 style={{
                fontSize: '42px',
                fontWeight: 600,
                color: 'var(--text-main)',
                marginBottom: '16px',
                textAlign: 'center',
              }}>
                Pick a color
              </h1>

              <p style={{
                fontSize: '16px',
                color: 'var(--text-dim)',
                marginBottom: '48px',
                textAlign: 'center',
              }}>
                This will be the signature color for {name || 'your project'}
              </p>

              <FullscreenColorPicker selected={color} onChange={setColor} />
            </motion.div>
          )}

          {/* STEP 3: Type */}
          {step === 'type' && (
            <motion.div
              key="type"
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -40 }}
              transition={{ duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
              }}
            >
              <h1 style={{
                fontSize: '42px',
                fontWeight: 600,
                color: 'var(--text-main)',
                marginBottom: '16px',
                textAlign: 'center',
              }}>
                How do you want to proceed?
              </h1>

              <p style={{
                fontSize: '16px',
                color: 'var(--text-dim)',
                marginBottom: '48px',
                textAlign: 'center',
              }}>
                Choose how you&apos;d like to manage this project
              </p>

              <div style={{ display: 'flex', gap: '24px' }}>
                <ProjectTypeCard
                  title="CEO Orchestrated"
                  subtitle="AI plans the project phases and automatically delegates work to the right agents."
                  icon={
                    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                      <path d="M9 3H5a2 2 0 00-2 2v4m6-6h10a2 2 0 012 2v4M9 3v18m0 0h10a2 2 0 002-2v-4M9 21H5a2 2 0 01-2-2v-4m0-6v6m18-6v6" />
                    </svg>
                  }
                  isSelected={projectType === 'ceo_orchestrated'}
                  onClick={() => setProjectType('ceo_orchestrated')}
                  color={color}
                  recommended
                />

                <ProjectTypeCard
                  title="Quick Start"
                  subtitle="Skip the planning phase and manage tasks manually. Best for simple projects."
                  icon={
                    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                      <path d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                  }
                  isSelected={projectType === 'quick'}
                  onClick={() => setProjectType('quick')}
                  color={color}
                />
              </div>
            </motion.div>
          )}

          {/* STEP 4: Briefing - One question at a time */}
          {step === 'briefing' && currentBriefingQuestion && (
            <motion.div
              key={`briefing-${briefingQuestionIndex}`}
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -40 }}
              transition={{ duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                width: '100%',
                maxWidth: '700px',
              }}
            >
              {/* Question progress indicator */}
              <div style={{
                display: 'flex',
                gap: '8px',
                marginBottom: '40px',
              }}>
                {BRIEFING_QUESTIONS.map((_, i) => (
                  <div
                    key={i}
                    style={{
                      width: i === briefingQuestionIndex ? '24px' : '8px',
                      height: '8px',
                      borderRadius: '4px',
                      backgroundColor: i <= briefingQuestionIndex ? color : 'rgba(255, 255, 255, 0.1)',
                      transition: 'all 0.3s ease',
                    }}
                  />
                ))}
              </div>

              <h1 style={{
                fontSize: '36px',
                fontWeight: 600,
                color: 'var(--text-main)',
                marginBottom: '12px',
                textAlign: 'center',
                lineHeight: 1.3,
              }}>
                {currentBriefingQuestion.question}
              </h1>

              {currentBriefingQuestion.hint && (
                <p style={{
                  fontSize: '15px',
                  color: 'var(--text-dim)',
                  marginBottom: '40px',
                  textAlign: 'center',
                  fontFamily: 'var(--font-mono, ui-monospace, monospace)',
                }}>
                  {currentBriefingQuestion.hint}
                </p>
              )}

              {/* First question: Text input */}
              {!currentBriefingQuestion.isMultipleChoice && (
                <>
                  <textarea
                    value={currentBriefingAnswer}
                    onChange={(e) => {
                      const key = currentBriefingQuestion.key
                      setBriefingAnswers(prev => ({ ...prev, [key]: e.target.value }))
                    }}
                    placeholder={currentBriefingQuestion.placeholder}
                    autoFocus
                    rows={3}
                    style={{
                      width: '100%',
                      padding: '24px',
                      fontSize: '18px',
                      lineHeight: 1.6,
                      backgroundColor: 'rgba(255, 255, 255, 0.03)',
                      border: `2px solid ${currentBriefingAnswer.trim() ? color : 'rgba(255, 255, 255, 0.08)'}`,
                      borderRadius: '20px',
                      color: 'var(--text-main)',
                      outline: 'none',
                      resize: 'none',
                      transition: 'border-color 0.2s ease',
                      fontFamily: 'inherit',
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey && currentBriefingAnswer.trim()) {
                        e.preventDefault()
                        goNext()
                      }
                    }}
                  />
                  <p style={{
                    marginTop: '20px',
                    fontSize: '13px',
                    fontFamily: 'var(--font-mono, ui-monospace, monospace)',
                    color: 'var(--text-dim)',
                  }}>
                    Press Enter to continue
                  </p>
                </>
              )}

              {/* Questions 2-5: Multiple choice with custom option */}
              {currentBriefingQuestion.isMultipleChoice && (
                <>
                  {/* Loading state */}
                  {isLoadingOptions && (
                    <div style={{
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      gap: '16px',
                      padding: '40px',
                    }}>
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                        style={{
                          width: '32px',
                          height: '32px',
                          border: `3px solid rgba(255, 255, 255, 0.1)`,
                          borderTopColor: color,
                          borderRadius: '50%',
                        }}
                      />
                      <p style={{
                        fontSize: '14px',
                        color: 'var(--text-dim)',
                        fontFamily: 'var(--font-mono, ui-monospace, monospace)',
                      }}>
                        Generating options based on your project...
                      </p>
                    </div>
                  )}

                  {/* Multiple choice options */}
                  {!isLoadingOptions && !showCustomInput && (
                    <div style={{
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '12px',
                      width: '100%',
                    }}>
                      {currentOptions.map((option, i) => {
                        const isSelected = currentBriefingAnswer === option
                        return (
                          <motion.button
                            key={i}
                            onClick={() => {
                              const key = currentBriefingQuestion.key
                              setBriefingAnswers(prev => ({ ...prev, [key]: option }))
                            }}
                            whileHover={{ scale: 1.01 }}
                            whileTap={{ scale: 0.99 }}
                            style={{
                              width: '100%',
                              padding: '20px 24px',
                              borderRadius: '16px',
                              border: `2px solid ${isSelected ? color : 'rgba(255, 255, 255, 0.08)'}`,
                              backgroundColor: isSelected ? `${color}15` : 'rgba(255, 255, 255, 0.02)',
                              cursor: 'pointer',
                              textAlign: 'left',
                              fontSize: '16px',
                              color: isSelected ? 'var(--text-main)' : 'var(--text-secondary)',
                              fontWeight: isSelected ? 500 : 400,
                              transition: 'all 0.2s ease',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '16px',
                            }}
                          >
                            <div style={{
                              width: '24px',
                              height: '24px',
                              borderRadius: '50%',
                              border: `2px solid ${isSelected ? color : 'rgba(255, 255, 255, 0.2)'}`,
                              backgroundColor: isSelected ? color : 'transparent',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              flexShrink: 0,
                            }}>
                              {isSelected && (
                                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#0a0a0a" strokeWidth="3">
                                  <path d="M5 13l4 4L19 7" />
                                </svg>
                              )}
                            </div>
                            {option}
                          </motion.button>
                        )
                      })}

                      {/* Custom answer option */}
                      <motion.button
                        onClick={() => setShowCustomInput(true)}
                        whileHover={{ scale: 1.01 }}
                        whileTap={{ scale: 0.99 }}
                        style={{
                          width: '100%',
                          padding: '20px 24px',
                          borderRadius: '16px',
                          border: '2px dashed rgba(255, 255, 255, 0.15)',
                          backgroundColor: 'transparent',
                          cursor: 'pointer',
                          textAlign: 'left',
                          fontSize: '16px',
                          color: 'var(--text-dim)',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '16px',
                        }}
                      >
                        <div style={{
                          width: '24px',
                          height: '24px',
                          borderRadius: '50%',
                          border: '2px solid rgba(255, 255, 255, 0.2)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          flexShrink: 0,
                        }}>
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M12 5v14M5 12h14" />
                          </svg>
                        </div>
                        Write my own answer...
                      </motion.button>
                    </div>
                  )}

                  {/* Custom input mode */}
                  {!isLoadingOptions && showCustomInput && (
                    <div style={{ width: '100%' }}>
                      <textarea
                        value={currentBriefingAnswer}
                        onChange={(e) => {
                          const key = currentBriefingQuestion.key
                          setBriefingAnswers(prev => ({ ...prev, [key]: e.target.value }))
                        }}
                        placeholder={currentBriefingQuestion.placeholder}
                        autoFocus
                        rows={3}
                        style={{
                          width: '100%',
                          padding: '24px',
                          fontSize: '18px',
                          lineHeight: 1.6,
                          backgroundColor: 'rgba(255, 255, 255, 0.03)',
                          border: `2px solid ${currentBriefingAnswer.trim() ? color : 'rgba(255, 255, 255, 0.08)'}`,
                          borderRadius: '20px',
                          color: 'var(--text-main)',
                          outline: 'none',
                          resize: 'none',
                          transition: 'border-color 0.2s ease',
                          fontFamily: 'inherit',
                        }}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' && !e.shiftKey && currentBriefingAnswer.trim()) {
                            e.preventDefault()
                            goNext()
                          }
                        }}
                      />
                      <button
                        onClick={() => {
                          setShowCustomInput(false)
                          // Clear the answer if going back to options
                          const key = currentBriefingQuestion.key
                          setBriefingAnswers(prev => ({ ...prev, [key]: '' }))
                        }}
                        style={{
                          marginTop: '16px',
                          padding: '10px 20px',
                          borderRadius: '10px',
                          border: '1px solid rgba(255, 255, 255, 0.1)',
                          backgroundColor: 'transparent',
                          cursor: 'pointer',
                          fontSize: '14px',
                          color: 'var(--text-dim)',
                        }}
                      >
                        Back to options
                      </button>
                    </div>
                  )}
                </>
              )}
            </motion.div>
          )}

          {/* STEP 5: Proposal */}
          {step === 'proposal' && proposal && (
            <motion.div
              key="proposal"
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -40 }}
              transition={{ duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                maxWidth: '800px',
              }}
            >
              {/* CEO Header */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '16px',
                marginBottom: '24px',
              }}>
                <div style={{
                  width: '56px',
                  height: '56px',
                  borderRadius: '16px',
                  backgroundColor: color,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: `0 8px 32px ${color}50`,
                }}>
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#0a0a0a" strokeWidth="2">
                    <path d="M12 2L4 8v8l8 6 8-6V8l-8-6z" />
                  </svg>
                </div>
                <div>
                  <h2 style={{
                    fontSize: '24px',
                    fontWeight: 600,
                    color: 'var(--text-main)',
                  }}>
                    CEO&apos;s Recommendation
                  </h2>
                  <p style={{
                    fontSize: '14px',
                    fontFamily: 'var(--font-mono, ui-monospace, monospace)',
                    color: 'var(--text-dim)',
                  }}>
                    for {name}
                  </p>
                </div>
              </div>

              <p style={{
                fontSize: '16px',
                color: 'var(--text-secondary)',
                lineHeight: 1.6,
                textAlign: 'center',
                marginBottom: '40px',
                maxWidth: '600px',
              }}>
                {proposal.summary}
              </p>

              {/* Stats */}
              <div style={{
                display: 'flex',
                gap: '24px',
                marginBottom: '40px',
              }}>
                {[
                  { label: 'Duration', value: proposal.totalDuration },
                  { label: 'Agents', value: `${proposal.agentCount} active` },
                  { label: 'Tasks', value: `~${proposal.estimatedTasks}` },
                ].map((stat) => (
                  <div
                    key={stat.label}
                    style={{
                      padding: '16px 28px',
                      borderRadius: '14px',
                      backgroundColor: 'rgba(255, 255, 255, 0.03)',
                      border: '1px solid rgba(255, 255, 255, 0.06)',
                      textAlign: 'center',
                    }}
                  >
                    <div style={{
                      fontSize: '11px',
                      fontFamily: 'var(--font-mono, ui-monospace, monospace)',
                      color: 'var(--text-dim)',
                      textTransform: 'uppercase',
                      letterSpacing: '0.1em',
                      marginBottom: '6px',
                    }}>
                      {stat.label}
                    </div>
                    <div style={{
                      fontSize: '18px',
                      fontWeight: 600,
                      color: 'var(--text-main)',
                    }}>
                      {stat.value}
                    </div>
                  </div>
                ))}
              </div>

              {/* Timeline */}
              <div style={{
                maxHeight: '280px',
                overflowY: 'auto',
                padding: '8px',
              }}>
                <ProposalTimeline phases={proposal.phases} color={color} />
              </div>
            </motion.div>
          )}

          {/* Launching */}
          {step === 'launching' && (
            <motion.div
              key="launching"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              style={{ width: '100%', height: '100%' }}
            >
              <LaunchScreen color={color} projectName={name} />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Bottom navigation */}
      {step !== 'launching' && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          style={{
            position: 'absolute',
            bottom: '40px',
            left: '50%',
            transform: 'translateX(-50%)',
            display: 'flex',
            gap: '16px',
          }}
        >
          {step !== 'name' && (
            <NavButton onClick={goBack} color={color}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M15 18l-6-6 6-6" />
              </svg>
              Back
            </NavButton>
          )}

          {step === 'name' && (
            <NavButton
              onClick={goNext}
              variant="primary"
              color={color}
              disabled={!name.trim()}
            >
              Continue
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M9 18l6-6-6-6" />
              </svg>
            </NavButton>
          )}

          {step === 'color' && (
            <NavButton onClick={goNext} variant="primary" color={color}>
              Continue
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M9 18l6-6-6-6" />
              </svg>
            </NavButton>
          )}

          {step === 'briefing' && (
            <NavButton
              onClick={goNext}
              variant="primary"
              color={color}
              disabled={!currentBriefingAnswer.trim()}
            >
              {isLastBriefingQuestion ? 'Review Proposal' : 'Next Question'}
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M9 18l6-6-6-6" />
              </svg>
            </NavButton>
          )}

          {step === 'type' && (
            <NavButton
              onClick={projectType === 'quick' ? handleCreateProject : goNext}
              variant="primary"
              color={color}
            >
              {projectType === 'quick' ? 'Create Project' : 'Continue to Briefing'}
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M9 18l6-6-6-6" />
              </svg>
            </NavButton>
          )}

          {step === 'proposal' && (
            <NavButton onClick={handleCreateProject} variant="primary" color={color}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 2L4 8v8l8 6 8-6V8l-8-6z" />
              </svg>
              Launch Project
            </NavButton>
          )}
        </motion.div>
      )}
    </motion.div>,
    document.body
  )
}
