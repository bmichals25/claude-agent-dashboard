'use client'

import { useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { useDashboardStore } from '@/lib/store'
import { formatTimestamp } from '@/lib/utils'
import type { ChatMessage } from '@/lib/types'

function MessageBubble({ message }: { message: ChatMessage }) {
  const isUser = message.role === 'user'
  const isSystem = message.role === 'system'

  return (
    <motion.div
      className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.3, ease: [0.23, 1, 0.32, 1] }}
    >
      <div
        className={`max-w-[85%] rounded-2xl px-4 py-3 ${
          isUser
            ? 'bg-accent/15 border border-accent/25'
            : isSystem
            ? 'bg-accent-tertiary/15 border border-accent-tertiary/25'
            : 'bg-[var(--glass)] border border-[var(--glass-border)]'
        }`}
      >
        {/* Agent indicator */}
        {message.agentId && (
          <div className="text-xs text-accent mb-1 font-mono font-medium">
            {message.agentId}
          </div>
        )}

        {/* Message content */}
        <div className="text-sm text-[var(--text-main)] whitespace-pre-wrap leading-relaxed">
          {message.content}
        </div>

        {/* Timestamp */}
        <div className="text-xs text-[var(--text-dim)] mt-2 font-mono">
          {formatTimestamp(message.timestamp)}
        </div>
      </div>
    </motion.div>
  )
}

export function ChatPanel() {
  const { messages, isStreaming } = useDashboardStore()
  const scrollRef = useRef<HTMLDivElement>(null)

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [messages])

  return (
    <div className="liquid-card flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-base font-semibold text-accent">
          Communication
        </h2>
        {isStreaming && (
          <motion.div
            className="flex items-center gap-2"
            animate={{ opacity: [0.5, 1, 0.5] }}
            transition={{ duration: 1.5, repeat: Infinity }}
          >
            <div className="w-2 h-2 rounded-full bg-accent" />
            <span className="text-xs text-accent font-mono font-medium">STREAMING</span>
          </motion.div>
        )}
      </div>

      {/* Messages */}
      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto space-y-4 pr-2 min-h-0"
      >
        <AnimatePresence mode="popLayout">
          {messages.length === 0 ? (
            <motion.div
              className="flex flex-col items-center justify-center py-12"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
            >
              <motion.div
                className="w-16 h-16 rounded-full bg-accent/10 flex items-center justify-center mb-4"
                animate={{ y: [0, -8, 0] }}
                transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
              >
                <motion.div
                  className="w-8 h-8 border-2 border-[var(--text-dim)] border-t-accent rounded-full"
                  animate={{ rotate: 360 }}
                  transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
                />
              </motion.div>
              <p className="text-sm text-[var(--text-secondary)]">Awaiting transmission...</p>
              <p className="text-xs text-[var(--text-dim)] mt-1 font-mono">Send a message to begin</p>
            </motion.div>
          ) : (
            messages.map(message => (
              <MessageBubble key={message.id} message={message} />
            ))
          )}
        </AnimatePresence>

        {/* Typing indicator */}
        {isStreaming && (
          <motion.div
            className="flex gap-1.5 px-4 py-2"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            {[0, 1, 2].map(i => (
              <motion.div
                key={i}
                className="w-2 h-2 rounded-full bg-accent"
                animate={{ y: [0, -6, 0], opacity: [0.4, 1, 0.4] }}
                transition={{
                  duration: 0.6,
                  repeat: Infinity,
                  delay: i * 0.15,
                }}
              />
            ))}
          </motion.div>
        )}
      </div>
    </div>
  )
}
