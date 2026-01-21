'use client'

import { useState, useCallback, useEffect } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { useDashboardStore } from '@/lib/store'

interface InstalledSkill {
  id: string
  filename: string
  path: string
}

interface Skill {
  id: string
  name: string
  description: string
  author: string
  category: string
  stars?: number
  downloads?: number
  url?: string
  tags: string[]
  isOfficial?: boolean
  isFeatured?: boolean
}

// Duotone SVG Icon System - primary fill with translucent accent highlights
const SKILL_ICONS: Record<string, (color: string, size?: number) => React.ReactNode> = {
  commit: (color, size = 24) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="12" r="10" fill={`${color}15`} />
      <path d="M12 8v4l3 3" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="12" cy="12" r="3" fill={color} />
    </svg>
  ),
  'review-pr': (color, size = 24) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <rect x="3" y="3" width="18" height="18" rx="3" fill={`${color}15`} />
      <path d="M8 10h8M8 14h5" stroke={color} strokeWidth="2" strokeLinecap="round" />
      <circle cx="17" cy="17" r="4" fill={color} fillOpacity="0.3" stroke={color} strokeWidth="1.5" />
      <path d="M19.5 19.5L21 21" stroke={color} strokeWidth="2" strokeLinecap="round" />
    </svg>
  ),
  'test-gen': (color, size = 24) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <path d="M9 3h6v4l3 3v8a2 2 0 01-2 2H8a2 2 0 01-2-2v-8l3-3V3z" fill={`${color}15`} stroke={color} strokeWidth="1.5" />
      <circle cx="10" cy="14" r="1.5" fill={color} />
      <circle cx="14" cy="16" r="1" fill={color} />
      <circle cx="12" cy="12" r="1" fill={color} />
    </svg>
  ),
  'doc-gen': (color, size = 24) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <path d="M6 2h9l5 5v15a2 2 0 01-2 2H6a2 2 0 01-2-2V4a2 2 0 012-2z" fill={`${color}15`} />
      <path d="M14 2v5h5" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
      <path d="M8 12h8M8 16h6" stroke={color} strokeWidth="2" strokeLinecap="round" />
    </svg>
  ),
  refactor: (color, size = 24) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="12" r="9" fill={`${color}15`} />
      <path d="M16 8l-4 4 4 4" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M8 8l4 4-4 4" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),
  'security-scan': (color, size = 24) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <path d="M12 2l8 4v6c0 5.5-3.8 10.2-8 12-4.2-1.8-8-6.5-8-12V6l8-4z" fill={`${color}15`} stroke={color} strokeWidth="1.5" />
      <path d="M9 12l2 2 4-4" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),
  'api-mock': (color, size = 24) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <rect x="3" y="8" width="8" height="8" rx="2" fill={`${color}15`} stroke={color} strokeWidth="1.5" />
      <rect x="13" y="8" width="8" height="8" rx="2" fill={`${color}15`} stroke={color} strokeWidth="1.5" />
      <path d="M11 12h2" stroke={color} strokeWidth="2" strokeLinecap="round" />
      <circle cx="7" cy="12" r="1.5" fill={color} />
      <circle cx="17" cy="12" r="1.5" fill={color} />
    </svg>
  ),
  deploy: (color, size = 24) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <path d="M12 3l7 4v6c0 4-3 7-7 9-4-2-7-5-7-9V7l7-4z" fill={`${color}15`} />
      <path d="M12 16V8M8 12l4-4 4 4" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),
  'ui-gen': (color, size = 24) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <rect x="3" y="3" width="18" height="18" rx="3" fill={`${color}15`} />
      <rect x="6" y="6" width="5" height="5" rx="1" fill={color} fillOpacity="0.5" />
      <rect x="13" y="6" width="5" height="3" rx="1" fill={color} fillOpacity="0.3" />
      <rect x="6" y="13" width="12" height="5" rx="1" fill={color} fillOpacity="0.4" />
    </svg>
  ),
  'migrate-db': (color, size = 24) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <ellipse cx="12" cy="6" rx="8" ry="3" fill={`${color}15`} stroke={color} strokeWidth="1.5" />
      <path d="M4 6v12c0 1.7 3.6 3 8 3s8-1.3 8-3V6" stroke={color} strokeWidth="1.5" />
      <ellipse cx="12" cy="12" rx="8" ry="3" fill={`${color}10`} stroke={color} strokeWidth="1" strokeDasharray="3 2" />
      <path d="M15 15l2 2-2 2" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),
  'perf-audit': (color, size = 24) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="14" r="8" fill={`${color}15`} />
      <path d="M12 14l4-6" stroke={color} strokeWidth="2.5" strokeLinecap="round" />
      <circle cx="12" cy="14" r="2" fill={color} />
      <path d="M6 10a8 8 0 0112 0" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  ),
  translate: (color, size = 24) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="12" r="9" fill={`${color}15`} stroke={color} strokeWidth="1.5" />
      <ellipse cx="12" cy="12" rx="4" ry="9" stroke={color} strokeWidth="1.5" />
      <path d="M3 12h18M5 7h14M5 17h14" stroke={color} strokeWidth="1" strokeOpacity="0.5" />
    </svg>
  ),
  default: (color, size = 24) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <rect x="3" y="3" width="18" height="18" rx="3" fill={`${color}15`} />
      <path d="M8 12h8M12 8v8" stroke={color} strokeWidth="2" strokeLinecap="round" />
    </svg>
  ),
}

const getSkillIcon = (skillId: string, color: string, size?: number) => {
  const iconFn = SKILL_ICONS[skillId] || SKILL_ICONS.default
  return iconFn(color, size)
}

const SKILLS: Skill[] = [
  // ===== OFFICIAL ANTHROPIC SKILLS =====
  // Document Skills
  {
    id: 'docx',
    name: 'docx',
    description: 'Create, edit, and analyze Word documents with tracked changes, comments, and formatting preservation',
    author: 'Anthropic',
    category: 'Documents',
    stars: 45500,
    downloads: 890000,
    url: 'https://github.com/anthropics/skills/tree/main/skills/docx',
    tags: ['documents', 'word', 'office'],
    isOfficial: true,
    isFeatured: true,
  },
  {
    id: 'pdf',
    name: 'pdf',
    description: 'Comprehensive PDF toolkit for extracting text/tables, creating, merging, splitting, and handling forms',
    author: 'Anthropic',
    category: 'Documents',
    stars: 42000,
    downloads: 850000,
    url: 'https://github.com/anthropics/skills/tree/main/skills/pdf',
    tags: ['documents', 'pdf'],
    isOfficial: true,
    isFeatured: true,
  },
  {
    id: 'pptx',
    name: 'pptx',
    description: 'Create and edit PowerPoint presentations with layouts, templates, charts, and automated slides',
    author: 'Anthropic',
    category: 'Documents',
    stars: 38000,
    downloads: 720000,
    url: 'https://github.com/anthropics/skills/tree/main/skills/pptx',
    tags: ['documents', 'powerpoint', 'presentations'],
    isOfficial: true,
  },
  {
    id: 'xlsx',
    name: 'xlsx',
    description: 'Create and analyze Excel spreadsheets with formulas, formatting, data analysis, and visualization',
    author: 'Anthropic',
    category: 'Documents',
    stars: 41000,
    downloads: 810000,
    url: 'https://github.com/anthropics/skills/tree/main/skills/xlsx',
    tags: ['documents', 'excel', 'spreadsheets'],
    isOfficial: true,
  },
  // Design & Creative
  {
    id: 'frontend-design',
    name: 'frontend-design',
    description: 'Build distinctive, production-grade frontend interfaces avoiding generic aesthetics with React & Tailwind',
    author: 'Anthropic',
    category: 'Frontend',
    stars: 32000,
    downloads: 580000,
    url: 'https://github.com/anthropics/skills/tree/main/skills/frontend-design',
    tags: ['react', 'tailwind', 'design'],
    isOfficial: true,
    isFeatured: true,
  },
  {
    id: 'artifacts-builder',
    name: 'artifacts-builder',
    description: 'Build complex claude.ai HTML artifacts using React, Tailwind CSS, and shadcn/ui components',
    author: 'Anthropic',
    category: 'Frontend',
    stars: 28000,
    downloads: 450000,
    url: 'https://github.com/anthropics/skills/tree/main/skills/artifacts-builder',
    tags: ['artifacts', 'react', 'shadcn'],
    isOfficial: true,
  },
  {
    id: 'algorithmic-art',
    name: 'algorithmic-art',
    description: 'Create generative art using p5.js with seeded randomness, flow fields, and particle systems',
    author: 'Anthropic',
    category: 'Creative',
    stars: 18000,
    downloads: 220000,
    url: 'https://github.com/anthropics/skills/tree/main/skills/algorithmic-art',
    tags: ['art', 'p5js', 'generative'],
    isOfficial: true,
  },
  {
    id: 'canvas-design',
    name: 'canvas-design',
    description: 'Design beautiful visual art in PNG and PDF formats using professional design philosophies',
    author: 'Anthropic',
    category: 'Creative',
    stars: 15000,
    downloads: 180000,
    url: 'https://github.com/anthropics/skills/tree/main/skills/canvas-design',
    tags: ['design', 'canvas', 'art'],
    isOfficial: true,
  },
  // Development
  {
    id: 'mcp-builder',
    name: 'mcp-builder',
    description: 'Guide for creating high-quality MCP servers to integrate external APIs and services with Claude',
    author: 'Anthropic',
    category: 'Development',
    stars: 25000,
    downloads: 380000,
    url: 'https://github.com/anthropics/skills/tree/main/skills/mcp-builder',
    tags: ['mcp', 'api', 'integration'],
    isOfficial: true,
  },
  {
    id: 'webapp-testing',
    name: 'webapp-testing',
    description: 'Test local web applications using Playwright for UI verification, debugging, and E2E testing',
    author: 'Anthropic',
    category: 'Testing',
    stars: 22000,
    downloads: 340000,
    url: 'https://github.com/anthropics/skills/tree/main/skills/webapp-testing',
    tags: ['testing', 'playwright', 'e2e'],
    isOfficial: true,
  },
  {
    id: 'skill-creator',
    name: 'skill-creator',
    description: 'Interactive tool that guides you through building new Claude skills with Q&A workflow',
    author: 'Anthropic',
    category: 'Development',
    stars: 19000,
    downloads: 290000,
    url: 'https://github.com/anthropics/skills/tree/main/skills/skill-creator',
    tags: ['skills', 'development', 'tooling'],
    isOfficial: true,
  },
  // Communication
  {
    id: 'internal-comms',
    name: 'internal-comms',
    description: 'Write professional internal communications like status reports, newsletters, and FAQs',
    author: 'Anthropic',
    category: 'Communication',
    stars: 12000,
    downloads: 150000,
    url: 'https://github.com/anthropics/skills/tree/main/skills/internal-comms',
    tags: ['communication', 'writing', 'business'],
    isOfficial: true,
  },

  // ===== COMMUNITY SKILLS =====
  {
    id: 'superpowers',
    name: 'superpowers',
    description: 'Core skills library with 20+ battle-tested skills including TDD, debugging, and collaboration patterns',
    author: 'obra',
    category: 'Development',
    stars: 8500,
    downloads: 125000,
    url: 'https://github.com/obra/superpowers',
    tags: ['tdd', 'debugging', 'workflow'],
  },
  {
    id: 'ios-simulator',
    name: 'ios-simulator-skill',
    description: 'iOS app building, navigation, and testing through Xcode simulator automation',
    author: 'conorluddy',
    category: 'Mobile',
    stars: 2400,
    downloads: 38000,
    url: 'https://github.com/conorluddy/ios-simulator-skill',
    tags: ['ios', 'xcode', 'mobile'],
  },
  {
    id: 'playwright-skill',
    name: 'playwright-skill',
    description: 'General-purpose browser automation using Playwright for web scraping and testing',
    author: 'lackeyjb',
    category: 'Testing',
    stars: 3200,
    downloads: 52000,
    url: 'https://github.com/lackeyjb/playwright-skill',
    tags: ['playwright', 'automation', 'browser'],
  },
  {
    id: 'd3js-skill',
    name: 'claude-d3js-skill',
    description: 'Create stunning data visualizations using D3.js with expert guidance and best practices',
    author: 'chrisvoncsefalvay',
    category: 'Data',
    stars: 1800,
    downloads: 28000,
    url: 'https://github.com/chrisvoncsefalvay/claude-d3js-skill',
    tags: ['d3js', 'visualization', 'data'],
  },
  {
    id: 'scientific-skills',
    name: 'scientific-skills',
    description: 'Specialized skills for scientific libraries, databases, and research workflows',
    author: 'K-Dense-AI',
    category: 'Data',
    stars: 1500,
    downloads: 22000,
    url: 'https://github.com/K-Dense-AI/claude-scientific-skills',
    tags: ['science', 'research', 'data'],
  },
  {
    id: 'web-asset-gen',
    name: 'web-asset-generator',
    description: 'Generate favicons, app icons, social media images, and other web assets automatically',
    author: 'alonw0',
    category: 'Frontend',
    stars: 980,
    downloads: 15000,
    url: 'https://github.com/alonw0/web-asset-generator',
    tags: ['assets', 'icons', 'images'],
  },
  {
    id: 'ffuf-fuzzing',
    name: 'ffuf-web-fuzzing',
    description: 'Expert guidance for ffuf web fuzzing during penetration testing and security audits',
    author: 'jthack',
    category: 'Security',
    stars: 2100,
    downloads: 31000,
    url: 'https://github.com/jthack/ffuf_claude_skill',
    tags: ['security', 'fuzzing', 'pentest'],
  },
  {
    id: 'trailofbits-security',
    name: 'security-analysis',
    description: 'Static analysis with CodeQL and Semgrep, variant analysis for security vulnerabilities',
    author: 'Trail of Bits',
    category: 'Security',
    stars: 4200,
    downloads: 68000,
    url: 'https://github.com/trailofbits/skills',
    tags: ['security', 'codeql', 'semgrep'],
  },
  {
    id: 'loki-mode',
    name: 'loki-mode',
    description: 'Multi-agent autonomous startup orchestration system for complex project management',
    author: 'asklokesh',
    category: 'Agents',
    stars: 1200,
    downloads: 18000,
    url: 'https://github.com/asklokesh/claudeskill-loki-mode',
    tags: ['agents', 'orchestration', 'automation'],
  },
  {
    id: 'skill-seekers',
    name: 'skill-seekers',
    description: 'Convert documentation websites into Claude Skills automatically',
    author: 'yusufkaraaslan',
    category: 'Development',
    stars: 890,
    downloads: 12000,
    url: 'https://github.com/yusufkaraaslan/Skill_Seekers',
    tags: ['skills', 'documentation', 'converter'],
  },
  {
    id: 'slack-gif',
    name: 'slack-gif-creator',
    description: 'Create animated GIFs optimized for Slack size constraints and quality',
    author: 'Anthropic',
    category: 'Creative',
    stars: 8500,
    downloads: 95000,
    url: 'https://github.com/anthropics/skills/tree/main/skills/slack-gif-creator',
    tags: ['gif', 'slack', 'animation'],
    isOfficial: true,
  },
]

// Categories without emoji, with skill counts computed dynamically
const CATEGORIES = [
  { id: 'all', label: 'All' },
  { id: 'installed', label: 'Installed' },
  { id: 'Documents', label: 'Documents' },
  { id: 'Frontend', label: 'Frontend' },
  { id: 'Development', label: 'Development' },
  { id: 'Creative', label: 'Creative' },
  { id: 'Testing', label: 'Testing' },
  { id: 'Security', label: 'Security' },
  { id: 'Data', label: 'Data' },
  { id: 'Mobile', label: 'Mobile' },
  { id: 'Communication', label: 'Comms' },
  { id: 'Agents', label: 'Agents' },
]

// Animation variants for staggered grid animations
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.03,
      delayChildren: 0.05,
    },
  },
}

function FeaturedCard({ skill, accentColor, isInstalled, onInstall, isInstalling }: {
  skill: Skill
  accentColor: string
  isInstalled: boolean
  onInstall: () => void
  isInstalling: boolean
}) {
  const Component = skill.url ? motion.a : motion.div
  const linkProps = skill.url ? {
    href: skill.url,
    target: '_blank',
    rel: 'noopener noreferrer',
  } : {}

  return (
    <Component
      {...linkProps}
      layout
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      whileHover={{ y: -4 }}
      transition={{
        layout: { duration: 0.2 },
        opacity: { duration: 0.15 },
        scale: { duration: 0.15 },
        y: { type: 'spring', stiffness: 400, damping: 25 }
      }}
      className="relative block overflow-hidden group"
      style={{
        borderRadius: '16px',
        background: `linear-gradient(135deg, ${accentColor}15 0%, rgba(255,255,255,0.03) 100%)`,
        padding: '24px',
        minHeight: '180px',
        cursor: 'pointer',
        textDecoration: 'none',
        border: `1px solid rgba(255,255,255,0.08)`,
      }}
    >
      {/* Border glow on hover */}
      <div
        className="absolute inset-0 rounded-[16px] opacity-0 group-hover:opacity-100 pointer-events-none"
        style={{
          border: `1px solid ${accentColor}40`,
          transition: 'opacity 0.2s ease',
        }}
      />

      {/* Glow effect */}
      <div
        className="absolute inset-0 pointer-events-none opacity-0 group-hover:opacity-60"
        style={{
          background: `radial-gradient(circle at 30% 30%, ${accentColor}20 0%, transparent 60%)`,
          transition: 'opacity 0.2s ease',
        }}
      />

      <div className="relative z-10">
        {/* Header */}
        <div className="flex items-start justify-between mb-3">
          <div
            className="w-11 h-11 rounded-xl flex items-center justify-center"
            style={{
              background: `linear-gradient(135deg, ${accentColor}30 0%, ${accentColor}10 100%)`,
              boxShadow: `0 4px 16px ${accentColor}20`,
            }}
          >
            {getSkillIcon(skill.id, accentColor, 24)}
          </div>
          {skill.isOfficial && (
            <div
              className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium"
              style={{
                background: `${accentColor}20`,
                color: accentColor,
              }}
            >
              <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor">
                <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Official
            </div>
          )}
        </div>

        {/* Title */}
        <h3
          className="font-semibold text-base mb-1.5 group-hover:text-current"
          style={{ color: 'var(--text-main)' }}
        >
          /{skill.name}
        </h3>

        {/* Description */}
        <p
          className="text-[13px] leading-relaxed mb-3 line-clamp-2"
          style={{ color: 'var(--text-secondary)', lineHeight: 1.5 }}
        >
          {skill.description}
        </p>

        {/* Footer */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1 text-xs" style={{ color: 'var(--text-muted)' }}>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor" opacity="0.6">
                <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
              </svg>
              {(skill.stars! / 1000).toFixed(1)}k
            </div>
            <div className="flex items-center gap-1 text-xs" style={{ color: 'var(--text-muted)' }}>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" opacity="0.6">
                <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M7 10l5 5 5-5M12 15V3" />
              </svg>
              {(skill.downloads! / 1000).toFixed(0)}k
            </div>
          </div>
          {isInstalled ? (
            <div
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-medium tracking-wide"
              style={{
                background: 'rgba(34, 197, 94, 0.12)',
                color: '#4ade80',
                backdropFilter: 'blur(8px)',
              }}
            >
              <svg width="11" height="11" viewBox="0 0 24 24" fill="currentColor">
                <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z" />
              </svg>
              Installed
            </div>
          ) : (
            <button
              onClick={(e) => {
                e.preventDefault()
                e.stopPropagation()
                onInstall()
              }}
              disabled={isInstalling}
              className="flex items-center gap-1.5 px-4 py-1.5 rounded-full text-[11px] font-medium tracking-wide transition-all"
              style={{
                background: isInstalling ? 'rgba(255,255,255,0.08)' : 'rgba(255,255,255,0.1)',
                color: isInstalling ? 'var(--text-muted)' : 'var(--text-main)',
                border: 'none',
                cursor: isInstalling ? 'wait' : 'pointer',
                backdropFilter: 'blur(8px)',
              }}
            >
              {isInstalling ? (
                <>
                  <svg className="animate-spin" width="11" height="11" viewBox="0 0 24 24" fill="none">
                    <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" strokeOpacity="0.3" />
                    <path d="M12 2a10 10 0 0 1 10 10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                  </svg>
                  Installing
                </>
              ) : (
                <>
                  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                    <path d="M12 5v14M5 12h14" />
                  </svg>
                  Get
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </Component>
  )
}

function SkillCard({ skill, accentColor, isInstalled, onInstall, isInstalling }: {
  skill: Skill
  accentColor: string
  isInstalled: boolean
  onInstall: () => void
  isInstalling: boolean
}) {
  const Component = skill.url ? motion.a : motion.div
  const linkProps = skill.url ? {
    href: skill.url,
    target: '_blank',
    rel: 'noopener noreferrer',
  } : {}

  return (
    <Component
      {...linkProps}
      layout
      initial={{ opacity: 0, scale: 0.97 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.97 }}
      whileHover={{ y: -2 }}
      transition={{
        layout: { duration: 0.2 },
        opacity: { duration: 0.15 },
        scale: { duration: 0.15 },
        y: { type: 'spring', stiffness: 400, damping: 25 }
      }}
      className="block relative overflow-hidden group"
      style={{
        borderRadius: '12px',
        background: 'rgba(255,255,255,0.03)',
        border: '1px solid rgba(255,255,255,0.06)',
        padding: '20px',
        cursor: 'pointer',
        textDecoration: 'none',
      }}
    >
      {/* Hover background */}
      <div
        className="absolute inset-0 opacity-0 group-hover:opacity-100 pointer-events-none"
        style={{
          background: 'rgba(255,255,255,0.03)',
          transition: 'opacity 0.15s ease',
        }}
      />

      {/* Border glow on hover */}
      <div
        className="absolute inset-0 rounded-[12px] opacity-0 group-hover:opacity-100 pointer-events-none"
        style={{
          border: `1px solid ${accentColor}30`,
          transition: 'opacity 0.15s ease',
        }}
      />

      {/* Subtle glow on hover */}
      <div
        className="absolute inset-0 pointer-events-none opacity-0 group-hover:opacity-40"
        style={{
          background: `radial-gradient(circle at 20% 50%, ${accentColor}15 0%, transparent 50%)`,
          transition: 'opacity 0.15s ease',
        }}
      />

      <div className="relative z-10 flex items-start gap-3">
        {/* Icon */}
        <div
          className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 group-hover:border-opacity-100"
          style={{
            background: 'rgba(255,255,255,0.05)',
            border: '1px solid rgba(255,255,255,0.08)',
            transition: 'all 0.15s ease',
          }}
        >
          <div className="group-hover:hidden">
            {getSkillIcon(skill.id, 'var(--text-secondary)', 20)}
          </div>
          <div className="hidden group-hover:block">
            {getSkillIcon(skill.id, accentColor, 20)}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 mb-0.5">
            <h4
              className="font-medium text-sm group-hover:text-[var(--accent)]"
              style={{
                color: 'var(--text-main)',
                transition: 'color 0.15s ease',
                // @ts-expect-error CSS variable
                '--accent': accentColor,
              }}
            >
              /{skill.name}
            </h4>
            {skill.isOfficial && (
              <svg width="12" height="12" viewBox="0 0 24 24" fill={accentColor}>
                <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            )}
          </div>
          <p
            className="text-[13px] line-clamp-2 mb-2"
            style={{ color: 'var(--text-secondary)', lineHeight: 1.4 }}
          >
            {skill.description}
          </p>
          <div className="flex items-center gap-3">
            <span className="text-[11px] font-mono" style={{ color: 'var(--text-muted)' }}>
              {skill.author}
            </span>
            <div className="flex items-center gap-1 text-[11px]" style={{ color: 'var(--text-muted)' }}>
              <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor" opacity="0.5">
                <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
              </svg>
              {(skill.stars! / 1000).toFixed(1)}k
            </div>
            <div className="flex items-center gap-1 text-[11px]" style={{ color: 'var(--text-muted)' }}>
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" opacity="0.5">
                <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M7 10l5 5 5-5M12 15V3" />
              </svg>
              {(skill.downloads! / 1000).toFixed(0)}k
            </div>
          </div>
        </div>

        {/* Install button or Installed badge */}
        {isInstalled ? (
          <div
            className="flex-shrink-0 flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-medium tracking-wide"
            style={{
              background: 'rgba(34, 197, 94, 0.12)',
              color: '#4ade80',
            }}
          >
            <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor">
              <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z" />
            </svg>
            Installed
          </div>
        ) : (
          <button
            className="flex-shrink-0 flex items-center gap-1 px-3 py-1 rounded-full text-[10px] font-medium tracking-wide transition-all skill-install-btn"
            style={{
              background: isInstalling ? 'rgba(255,255,255,0.06)' : 'rgba(255,255,255,0.08)',
              color: isInstalling ? 'var(--text-muted)' : 'var(--text-secondary)',
              border: 'none',
              cursor: isInstalling ? 'wait' : 'pointer',
            }}
            onClick={(e) => {
              e.preventDefault()
              e.stopPropagation()
              onInstall()
            }}
            disabled={isInstalling}
          >
            {isInstalling ? (
              <>
                <svg className="animate-spin" width="10" height="10" viewBox="0 0 24 24" fill="none">
                  <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" strokeOpacity="0.3" />
                  <path d="M12 2a10 10 0 0 1 10 10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                </svg>
              </>
            ) : (
              <>
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                  <path d="M12 5v14M5 12h14" />
                </svg>
                Get
              </>
            )}
          </button>
        )}
      </div>

      {/* Button hover state overlay - only for non-installed skills */}
      {!isInstalled && (
        <style>{`
          .group:hover .skill-install-btn:not(:disabled) {
            background: rgba(255,255,255,0.15) !important;
            color: var(--text-main) !important;
          }
          .group:hover .group-hover\\:border-opacity-100 {
            background: ${accentColor}15 !important;
            border-color: ${accentColor}30 !important;
          }
        `}</style>
      )}
    </Component>
  )
}

function CategoryPill({ category, isActive, accentColor, onClick, count }: {
  category: { id: string; label: string }
  isActive: boolean
  accentColor: string
  onClick: () => void
  count?: number
}) {
  const isInstalled = category.id === 'installed'
  const pillColor = isInstalled ? '#22c55e' : accentColor

  return (
    <motion.button
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className="flex items-center gap-1.5 whitespace-nowrap"
      style={{
        padding: '8px 14px',
        borderRadius: '10px',
        background: isActive ? `${pillColor}20` : 'rgba(255,255,255,0.04)',
        border: `1px solid ${isActive ? pillColor + '40' : 'rgba(255,255,255,0.06)'}`,
        color: isActive ? pillColor : 'var(--text-secondary)',
        fontSize: '13px',
        fontWeight: isActive ? 500 : 400,
        cursor: 'pointer',
        transition: 'all 0.2s ease',
      }}
    >
      {isInstalled && (
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
          <polyline points="20,6 9,17 4,12" />
        </svg>
      )}
      <span>{category.label}</span>
      {count !== undefined && count > 0 && (
        <span
          className="text-[10px] px-1.5 py-0.5 rounded-full"
          style={{
            background: isActive ? `${pillColor}30` : 'rgba(255,255,255,0.08)',
            color: isActive ? pillColor : 'var(--text-muted)',
          }}
        >
          {count}
        </span>
      )}
    </motion.button>
  )
}

export function SkillsStore() {
  const settings = useDashboardStore((state) => state.settings)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [isSearching, setIsSearching] = useState(false)
  const [searchResults, setSearchResults] = useState<Skill[]>([])
  const [hasSearched, setHasSearched] = useState(false)
  const [installedSkills, setInstalledSkills] = useState<InstalledSkill[]>([])
  const [installingSkills, setInstallingSkills] = useState<Set<string>>(new Set())

  const accentColor = settings.accentColor

  // Fetch installed skills on mount
  useEffect(() => {
    const fetchInstalledSkills = async () => {
      try {
        const response = await fetch('/api/skills')
        if (response.ok) {
          const data = await response.json()
          setInstalledSkills(data.installedSkills || [])
        }
      } catch (error) {
        console.error('Failed to fetch installed skills:', error)
      }
    }
    fetchInstalledSkills()
  }, [])

  // Check if a skill is installed
  const isSkillInstalled = useCallback((skillId: string) => {
    return installedSkills.some(
      installed => installed.id.toLowerCase() === skillId.toLowerCase()
    )
  }, [installedSkills])

  // Install a skill
  const installSkill = useCallback(async (skill: Skill) => {
    if (!skill.url || isSkillInstalled(skill.id)) return

    setInstallingSkills(prev => new Set(prev).add(skill.id))

    try {
      const response = await fetch('/api/skills', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          skillId: skill.id,
          skillName: skill.name,
          githubUrl: skill.url,
        }),
      })

      if (response.ok) {
        const data = await response.json()
        // Add to installed skills
        setInstalledSkills(prev => [
          ...prev,
          { id: skill.id, filename: data.filename, path: data.path }
        ])
      } else {
        const error = await response.json()
        console.error('Failed to install skill:', error)
        alert(`Failed to install ${skill.name}: ${error.error}`)
      }
    } catch (error) {
      console.error('Failed to install skill:', error)
      alert(`Failed to install ${skill.name}`)
    } finally {
      setInstallingSkills(prev => {
        const next = new Set(prev)
        next.delete(skill.id)
        return next
      })
    }
  }, [isSkillInstalled])

  const filteredSkills = SKILLS.filter((skill) => {
    let matchesCategory = false
    if (selectedCategory === 'all') {
      matchesCategory = true
    } else if (selectedCategory === 'installed') {
      matchesCategory = isSkillInstalled(skill.id)
    } else {
      matchesCategory = skill.category === selectedCategory
    }
    const matchesSearch = !searchQuery ||
      skill.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      skill.description.toLowerCase().includes(searchQuery.toLowerCase())
    return matchesCategory && matchesSearch
  })

  const handleWebSearch = useCallback(async () => {
    if (!searchQuery.trim()) return
    setIsSearching(true)
    setHasSearched(true)
    await new Promise(resolve => setTimeout(resolve, 1200))
    const mockResults: Skill[] = [
      {
        id: `search-${Date.now()}-1`,
        name: searchQuery.toLowerCase().replace(/\s+/g, '-'),
        description: `Community-built skill for ${searchQuery} workflows`,
        author: 'Community',
        category: 'Community',
        stars: Math.floor(Math.random() * 500) + 100,
        downloads: Math.floor(Math.random() * 10000) + 1000,
        url: `https://github.com/search?q=claude+code+${encodeURIComponent(searchQuery)}`,
        tags: [searchQuery.toLowerCase()],
      },
    ]
    setSearchResults(mockResults)
    setIsSearching(false)
  }, [searchQuery])

  const featuredSkills = filteredSkills.filter(s => s.isFeatured)
  const regularSkills = filteredSkills.filter(s => !s.isFeatured)

  // Compute category counts for badges
  const getCategoryCount = (categoryId: string) => {
    if (categoryId === 'all') return SKILLS.length
    if (categoryId === 'installed') return installedSkills.length
    return SKILLS.filter(s => s.category === categoryId).length
  }

  return (
    <div className="h-full overflow-y-auto scrollbar-fade">
      <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '48px 56px 120px' }}>

        {/* Header */}
        <motion.header
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          style={{ marginBottom: '48px' }}
        >
          <div style={{ marginBottom: '32px' }}>
            <h1
              style={{
                fontSize: '32px',
                fontWeight: 700,
                color: 'var(--text-main)',
                letterSpacing: '-0.02em',
                lineHeight: 1.2,
              }}
            >
              Skills Store
            </h1>
            <p
              style={{
                fontSize: '14px',
                fontFamily: '"JetBrains Mono", ui-monospace, monospace',
                color: 'var(--text-dim)',
                marginTop: '6px',
                letterSpacing: '0.02em',
              }}
            >
              {SKILLS.length} skills · Discover and install powerful tools for Claude Code
            </p>
          </div>

          {/* Search */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              padding: '12px 18px',
              background: 'rgba(255,255,255,0.04)',
              borderRadius: '14px',
              border: '1px solid rgba(255,255,255,0.06)',
              maxWidth: '560px',
            }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" strokeWidth="1.5">
              <circle cx="11" cy="11" r="8" />
              <path d="M21 21l-4.35-4.35" />
            </svg>
            <input
              type="text"
              placeholder="Search skills by name or description..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleWebSearch()}
              style={{
                flex: 1,
                background: 'transparent',
                fontSize: '14px',
                color: 'var(--text-main)',
                border: 'none',
                outline: 'none',
                boxShadow: 'none',
              }}
            />
            {searchQuery && (
              <motion.button
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                onClick={handleWebSearch}
                disabled={isSearching}
                style={{
                  padding: '6px 12px',
                  borderRadius: '8px',
                  fontSize: '12px',
                  fontWeight: 500,
                  background: accentColor,
                  color: 'var(--bg)',
                  border: 'none',
                  cursor: 'pointer',
                }}
              >
                {isSearching ? '...' : 'Search Web'}
              </motion.button>
            )}
          </div>
        </motion.header>

        {/* Filter bar */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.3 }}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            marginBottom: '32px',
            padding: '8px',
            borderRadius: '16px',
            background: 'rgba(255, 255, 255, 0.02)',
            border: '1px solid rgba(255, 255, 255, 0.04)',
            overflowX: 'auto',
          }}
          className="scrollbar-fade"
        >
          {CATEGORIES.map((category) => (
            <CategoryPill
              key={category.id}
              category={category}
              isActive={selectedCategory === category.id}
              accentColor={accentColor}
              onClick={() => setSelectedCategory(category.id)}
              count={getCategoryCount(category.id)}
            />
          ))}
        </motion.div>

        {/* Web search results */}
        <AnimatePresence>
          {hasSearched && searchResults.length > 0 && (
            <motion.section
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className="mb-8"
            >
              <div className="flex items-center gap-3 mb-6">
                <h2 className="text-base font-semibold" style={{ color: 'var(--text-main)' }}>
                  Web Results
                </h2>
                <div className="flex-1 h-px" style={{ background: 'rgba(255,255,255,0.08)' }} />
              </div>
              <motion.div
                variants={containerVariants}
                initial="hidden"
                animate="visible"
                className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3"
              >
                <AnimatePresence mode="popLayout">
                  {searchResults.map((skill) => (
                    <SkillCard
                      key={skill.id}
                      skill={skill}
                      accentColor={accentColor}
                      isInstalled={isSkillInstalled(skill.id)}
                      onInstall={() => installSkill(skill)}
                      isInstalling={installingSkills.has(skill.id)}
                    />
                  ))}
                </AnimatePresence>
              </motion.div>
            </motion.section>
          )}
        </AnimatePresence>

        {/* Featured skills */}
        <AnimatePresence>
          {featuredSkills.length > 0 && selectedCategory === 'all' && !searchQuery && (
            <motion.section
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className="mb-8"
            >
              <div className="flex items-center gap-2 mb-6">
                <h2 className="text-base font-semibold" style={{ color: 'var(--text-main)' }}>
                  Featured
                </h2>
                <div
                  className="px-1.5 py-0.5 rounded text-[10px] font-medium"
                  style={{ background: `${accentColor}20`, color: accentColor }}
                >
                  Staff Picks
                </div>
              </div>
              <motion.div
                variants={containerVariants}
                initial="hidden"
                animate="visible"
                className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4"
              >
                <AnimatePresence mode="popLayout">
                  {featuredSkills.map((skill) => (
                    <FeaturedCard
                      key={skill.id}
                      skill={skill}
                      accentColor={accentColor}
                      isInstalled={isSkillInstalled(skill.id)}
                      onInstall={() => installSkill(skill)}
                      isInstalling={installingSkills.has(skill.id)}
                    />
                  ))}
                </AnimatePresence>
              </motion.div>
            </motion.section>
          )}
        </AnimatePresence>

        {/* All skills */}
        <motion.section
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.15 }}
        >
          <div className="flex items-center gap-2 mb-6">
            <h2 className="text-base font-semibold" style={{ color: 'var(--text-main)' }}>
              {selectedCategory === 'all' ? 'All Skills' : CATEGORIES.find(c => c.id === selectedCategory)?.label}
            </h2>
            <span className="text-[13px]" style={{ color: 'var(--text-muted)' }}>
              {filteredSkills.length} {filteredSkills.length === 1 ? 'skill' : 'skills'}
            </span>
          </div>
          <motion.div
            key={selectedCategory}
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3"
          >
            <AnimatePresence mode="popLayout">
              {(selectedCategory === 'all' && !searchQuery ? regularSkills : filteredSkills).map((skill) => (
                <SkillCard
                  key={skill.id}
                  skill={skill}
                  accentColor={accentColor}
                  isInstalled={isSkillInstalled(skill.id)}
                  onInstall={() => installSkill(skill)}
                  isInstalling={installingSkills.has(skill.id)}
                />
              ))}
            </AnimatePresence>
          </motion.div>
        </motion.section>

        {/* Empty state */}
        {filteredSkills.length === 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-16"
          >
            <div
              className="w-14 h-14 rounded-xl flex items-center justify-center mx-auto mb-4"
              style={{ background: 'rgba(255,255,255,0.05)' }}
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" strokeWidth="1.5">
                <circle cx="11" cy="11" r="8" />
                <path d="M21 21l-4.35-4.35" />
              </svg>
            </div>
            <p className="text-base mb-1.5" style={{ color: 'var(--text-main)' }}>No skills found</p>
            <p className="text-[13px] mb-5" style={{ color: 'var(--text-muted)' }}>
              Try adjusting your search or category filter
            </p>
            <button
              onClick={() => {
                setSearchQuery('')
                setSelectedCategory('all')
              }}
              className="px-4 py-2 rounded-lg text-[13px] font-medium"
              style={{
                background: `${accentColor}20`,
                color: accentColor,
                border: 'none',
                cursor: 'pointer',
              }}
            >
              Clear Filters
            </button>
          </motion.div>
        )}

        {/* Footer */}
        <motion.footer
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="mt-10 pt-4"
          style={{ borderTop: '1px solid rgba(255,255,255,0.04)' }}
        >
          <div className="flex items-center justify-between text-[11px]" style={{ color: 'var(--text-muted)' }}>
            <span>Claude Code Skills</span>
            <div className="flex items-center gap-4">
              <a
                href="https://docs.anthropic.com/claude-code/skills"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:underline"
              >
                Docs
              </a>
              <a
                href="https://github.com/anthropics/claude-code"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:underline"
              >
                GitHub
              </a>
            </div>
          </div>
        </motion.footer>
      </div>
    </div>
  )
}
