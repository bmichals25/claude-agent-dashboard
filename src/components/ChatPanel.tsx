'use client'

import { useRef, useEffect, useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { useDashboardStore } from '@/lib/store'
import { formatTimestamp } from '@/lib/utils'
import { getAgentResponses } from '@/lib/agentResponses'
import type { ChatMessage, AgentId } from '@/lib/types'

// Agent color mapping
const AGENT_COLORS: Record<string, string> = {
  ceo: '#00fff0',
  chief_of_staff: '#ff00c1',
  pipeline_manager: '#7000ff',
  agent_operations: '#00ffaa',
  vp_engineering: '#00ff66',
  vp_product: '#ffaa00',
  vp_design_qa: '#ff6b6b',
  architect: '#06b6d4',
  developer: '#22c55e',
  devops_engineer: '#f59e0b',
  code_reviewer: '#a855f7',
  security_engineer: '#ef4444',
  product_researcher: '#3b82f6',
  product_manager: '#f97316',
  data_engineer: '#6366f1',
  growth_marketer: '#ec4899',
  frontend_designer: '#14b8a6',
  user_testing: '#8b5cf6',
  technical_writer: '#64748b',
}

function getAgentColor(agentId: string | undefined): string {
  if (!agentId) return 'var(--accent)'
  return AGENT_COLORS[agentId] || 'var(--accent)'
}

function formatAgentName(agentId: AgentId): string {
  if (agentId === 'ceo') return 'CEO'
  return agentId.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')
}

function MessageBubble({ message, isLast }: { message: ChatMessage; isLast: boolean }) {
  const isUser = message.role === 'user'
  const isSystem = message.role === 'system'
  const agentColor = getAgentColor(message.agentId)

  return (
    <motion.div
      className={`flex flex-col ${isUser ? 'items-end' : 'items-start'}`}
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, ease: [0.23, 1, 0.32, 1] }}
    >
      {/* Agent label - outside bubble */}
      {message.agentId && !isUser && (
        <div className="flex items-center gap-2 mb-1.5 ml-1">
          <div
            className="w-1.5 h-1.5 rounded-full"
            style={{ backgroundColor: agentColor, boxShadow: `0 0 6px ${agentColor}` }}
          />
          <span
            className="text-[10px] font-mono uppercase tracking-wider"
            style={{ color: agentColor }}
          >
            {message.agentId === 'ceo' ? 'CEO' : message.agentId.replace(/_/g, ' ')}
          </span>
        </div>
      )}

      {/* Message bubble */}
      <div
        className={`max-w-[88%] rounded-2xl transition-all ${
          isUser
            ? 'bg-[var(--bg-surface)] rounded-tr-md'
            : isSystem
            ? 'bg-[var(--accent-tertiary)]/8 rounded-tl-md'
            : 'rounded-tl-md'
        }`}
        style={{
          padding: '12px 16px',
          border: isUser
            ? '1px solid rgba(255, 200, 150, 0.12)'
            : `1px solid ${agentColor}25`,
          background: isUser
            ? undefined
            : isSystem
            ? undefined
            : `linear-gradient(135deg, ${agentColor}08 0%, ${agentColor}03 100%)`,
        }}
      >
        {/* Message content */}
        <p className="text-[13px] text-[var(--text-main)] whitespace-pre-wrap leading-[1.6]">
          {message.content}
        </p>
      </div>

      {/* Timestamp - outside bubble, subtle */}
      <div className={`text-[10px] text-[var(--text-muted)] font-mono mt-1.5 ${isUser ? 'mr-1' : 'ml-1'}`}>
        {formatTimestamp(message.timestamp)}
      </div>
    </motion.div>
  )
}

export function ChatPanel() {
  const { messages, isStreaming, selectedAgentId, agents } = useDashboardStore()
  const hasAgentPanelRight = !!selectedAgentId

  // Get current chat agent - selected agent or CEO
  const currentChatAgent = selectedAgentId
    ? agents.find(a => a.id === selectedAgentId)
    : agents.find(a => a.id === 'ceo')

  const isAgentChat = !!selectedAgentId && selectedAgentId !== 'ceo'
  const chatAgentId = currentChatAgent?.id || 'ceo'
  const chatAgentName = currentChatAgent?.displayName || 'CEO'
  const chatAgentColor = currentChatAgent?.color || '#00fff0'
  const chatAgentSpecialty = getAgentResponses(chatAgentId as AgentId).specialty
  const scrollRef = useRef<HTMLDivElement>(null)
  const bottomRef = useRef<HTMLDivElement>(null)
  const [isAtBottom, setIsAtBottom] = useState(true)
  const [showScrollButton, setShowScrollButton] = useState(false)

  // Check if scrolled to bottom
  const checkIfAtBottom = useCallback(() => {
    if (scrollRef.current) {
      const { scrollTop, scrollHeight, clientHeight } = scrollRef.current
      const atBottom = scrollHeight - scrollTop - clientHeight < 50
      setIsAtBottom(atBottom)
      setShowScrollButton(!atBottom && messages.length > 0)
    }
  }, [messages.length])

  // Listen for scroll events
  useEffect(() => {
    const scrollEl = scrollRef.current
    if (scrollEl) {
      scrollEl.addEventListener('scroll', checkIfAtBottom)
      return () => scrollEl.removeEventListener('scroll', checkIfAtBottom)
    }
  }, [checkIfAtBottom])

  // Auto-scroll to bottom on new messages (only if already at bottom)
  useEffect(() => {
    if (isAtBottom && bottomRef.current) {
      bottomRef.current.scrollIntoView({ behavior: 'smooth', block: 'end' })
    } else if (!isAtBottom && messages.length > 0) {
      setShowScrollButton(true)
    }
  }, [messages, isStreaming, isAtBottom])

  // Scroll to bottom handler
  const scrollToBottom = useCallback(() => {
    if (bottomRef.current) {
      bottomRef.current.scrollIntoView({ behavior: 'smooth', block: 'end' })
      setIsAtBottom(true)
      setShowScrollButton(false)
    }
  }, [])

  return (
    <div
      className="flex flex-col h-full transition-all duration-300"
      style={{
        position: 'relative',
        background: 'linear-gradient(180deg, var(--bg-elevated) 0%, var(--bg-surface) 100%)',
        border: '1px solid var(--glass-border)',
        borderBottom: 'none',
        borderRight: hasAgentPanelRight ? 'none' : undefined,
        borderRadius: hasAgentPanelRight ? '16px 0 0 0' : '16px 16px 0 0',
        padding: '16px',
      }}
    >
      {/* Header */}
      <div className="flex items-center justify-between pb-4 border-b border-[var(--glass-border)]">
        <div className="flex items-center gap-3">
          {/* Agent indicator */}
          <div
            className="flex items-center gap-2 px-3 py-1.5 rounded-full"
            style={{
              background: `${chatAgentColor}12`,
              border: `1px solid ${chatAgentColor}30`,
            }}
          >
            <div
              className="w-2 h-2 rounded-full"
              style={{
                backgroundColor: chatAgentColor,
                boxShadow: `0 0 8px ${chatAgentColor}`,
              }}
            />
            <span
              className="text-xs font-semibold tracking-wide"
              style={{ color: chatAgentColor }}
            >
              {chatAgentName}
            </span>
          </div>
          {/* CEO listening indicator when chatting with non-CEO agent */}
          {isAgentChat && (
            <div className="flex items-center gap-1.5 px-2 py-1 rounded-full bg-[var(--glass)]">
              <div
                className="w-1.5 h-1.5 rounded-full"
                style={{ backgroundColor: '#00fff0', opacity: 0.6 }}
              />
              <span className="text-[9px] font-mono text-[var(--text-muted)]">
                CEO listening
              </span>
            </div>
          )}
          {messages.length > 0 && (
            <span className="text-[10px] font-mono text-[var(--text-muted)] bg-[var(--glass)] px-2 py-0.5 rounded-full">
              {messages.length}
            </span>
          )}
        </div>
        {isStreaming && (
          <motion.div
            className="flex items-center gap-2"
            animate={{ opacity: [0.6, 1, 0.6] }}
            transition={{ duration: 1.2, repeat: Infinity }}
          >
            <div
              className="w-2 h-2 rounded-full"
              style={{ backgroundColor: chatAgentColor }}
            />
            <span
              className="text-[10px] font-mono tracking-wider"
              style={{ color: chatAgentColor }}
            >
              TYPING
            </span>
          </motion.div>
        )}
      </div>

      {/* Messages */}
      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto space-y-4 pr-1 min-h-0 pt-4 scrollbar-fade"
        style={{
          maskImage: 'linear-gradient(to bottom, transparent 0%, black 8px, black 92%, transparent 100%)',
          WebkitMaskImage: 'linear-gradient(to bottom, transparent 0%, black 8px, black 92%, transparent 100%)',
        }}
      >
        <AnimatePresence mode="popLayout">
          {messages.length === 0 ? (
            <motion.div
              className="flex flex-col items-center justify-center h-full min-h-[200px]"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
            >
              {/* Static chat bubble icon */}
              <div
                className="w-14 h-14 mb-5 rounded-2xl flex items-center justify-center"
                style={{
                  backgroundColor: `${chatAgentColor}12`,
                  border: `1px solid ${chatAgentColor}25`,
                  boxShadow: `0 0 30px ${chatAgentColor}15`,
                }}
              >
                <svg
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke={chatAgentColor}
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
                </svg>
              </div>
              <p className="text-sm text-[var(--text-secondary)] mb-1">
                Chat with <span style={{ color: chatAgentColor, fontWeight: 500 }}>{chatAgentName}</span>
              </p>
              <p className="text-[11px] text-[var(--text-muted)] font-mono text-center px-4 max-w-[280px]">
                {chatAgentSpecialty}
              </p>
            </motion.div>
          ) : (
            messages.map((message, i) => (
              <MessageBubble key={message.id} message={message} isLast={i === messages.length - 1} />
            ))
          )}
        </AnimatePresence>

        {/* Typing indicator */}
        <AnimatePresence>
          {isStreaming && (
            <motion.div
              className="flex items-center gap-2 pl-1 pt-2"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
            >
              <div className="flex gap-1">
                {[0, 1, 2].map(i => (
                  <motion.div
                    key={i}
                    className="w-1.5 h-1.5 rounded-full"
                    style={{ backgroundColor: chatAgentColor }}
                    animate={{ y: [0, -4, 0], opacity: [0.3, 1, 0.3] }}
                    transition={{
                      duration: 0.5,
                      repeat: Infinity,
                      delay: i * 0.12,
                    }}
                  />
                ))}
              </div>
              <span
                className="text-[10px] font-mono"
                style={{ color: chatAgentColor }}
              >
                {chatAgentName} typing
              </span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Scroll anchor */}
        <div ref={bottomRef} />
      </div>

      {/* Scroll to bottom button */}
      <AnimatePresence>
        {showScrollButton && (
          <motion.button
            initial={{ opacity: 0, y: 10, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.9 }}
            onClick={scrollToBottom}
            style={{
              position: 'absolute',
              bottom: '16px',
              left: '50%',
              transform: 'translateX(-50%)',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '8px 14px',
              borderRadius: '20px',
              background: chatAgentColor,
              border: 'none',
              cursor: 'pointer',
              boxShadow: `0 4px 20px ${chatAgentColor}40`,
              zIndex: 10,
            }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <svg
              width="12"
              height="12"
              viewBox="0 0 24 24"
              fill="none"
              stroke="var(--bg)"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M12 5v14M19 12l-7 7-7-7" />
            </svg>
            <span
              style={{
                fontSize: '11px',
                fontWeight: 600,
                color: 'var(--bg)',
              }}
            >
              New messages
            </span>
          </motion.button>
        )}
      </AnimatePresence>
    </div>
  )
}
