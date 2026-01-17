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
      transition={{ duration: 0.3 }}
    >
      <div
        className={`max-w-[80%] rounded-2xl px-4 py-3 ${
          isUser
            ? 'bg-accent/20 border border-accent/30'
            : isSystem
            ? 'bg-purple-500/20 border border-purple-500/30'
            : 'bg-white/5 border border-white/10'
        }`}
      >
        {/* Agent indicator */}
        {message.agentId && (
          <div className="text-xs text-accent mb-1 font-mono uppercase">
            {message.agentId}
          </div>
        )}

        {/* Message content */}
        <div className="text-sm text-white/90 whitespace-pre-wrap">
          {message.content}
        </div>

        {/* Timestamp */}
        <div className="text-xs text-white/40 mt-2 font-mono">
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
        <h2 className="text-sm uppercase tracking-widest text-accent font-bold">
          Communication
        </h2>
        {isStreaming && (
          <motion.div
            className="flex items-center gap-2"
            animate={{ opacity: [0.5, 1, 0.5] }}
            transition={{ duration: 1.5, repeat: Infinity }}
          >
            <div className="w-2 h-2 rounded-full bg-accent" />
            <span className="text-xs text-accent font-mono">STREAMING</span>
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
              className="text-center text-white/40 py-8"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
            >
              <p className="text-sm">No messages yet.</p>
              <p className="text-xs mt-2">Send a message to begin.</p>
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
            className="flex gap-1 px-4 py-2"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            {[0, 1, 2].map(i => (
              <motion.div
                key={i}
                className="w-2 h-2 rounded-full bg-accent/60"
                animate={{ y: [0, -5, 0] }}
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
