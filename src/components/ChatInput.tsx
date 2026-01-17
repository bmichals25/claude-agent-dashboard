'use client'

import { useState, useRef, useCallback } from 'react'
import { motion } from 'motion/react'
import { useDashboardStore } from '@/lib/store'
import { useSupabase } from '@/components/providers/SupabaseProvider'
import { generateId } from '@/lib/utils'
import type { Message, Task } from '@/lib/types'

export function ChatInput() {
  const [value, setValue] = useState('')
  const [isFocused, setIsFocused] = useState(false)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const { addMessage, addTask, updateAgentStatus, setStreaming } = useDashboardStore()
  const { saveMessage, saveTask, saveEvent, isConfigured } = useSupabase()

  const handleSubmit = useCallback(async () => {
    const trimmed = value.trim()
    if (!trimmed) return

    // Add user message
    const userMessage: Message = {
      id: generateId(),
      role: 'user',
      content: trimmed,
      timestamp: new Date(),
    }
    addMessage(userMessage)
    setValue('')

    // Persist to Supabase
    if (isConfigured) {
      await saveMessage(userMessage)
    }

    // Create a task from the message
    const task: Task = {
      id: generateId(),
      title: trimmed.length > 50 ? trimmed.slice(0, 50) + '...' : trimmed,
      description: trimmed,
      status: 'pending',
      priority: 'medium',
      assignedTo: 'ceo',
      delegatedFrom: undefined,
      createdAt: new Date(),
      updatedAt: new Date(),
      completedAt: undefined,
      projectId: null,
      streamOutput: [],
      progress: 0,
    }
    addTask(task)

    // Persist task to Supabase
    if (isConfigured) {
      await saveTask(task)
    }

    // Simulate CEO receiving and processing
    updateAgentStatus('ceo', 'thinking')
    setStreaming(true)

    // Simulate streaming response
    setTimeout(async () => {
      updateAgentStatus('ceo', 'working', task)

      // Add assistant acknowledgment
      const ackMessage: Message = {
        id: generateId(),
        role: 'assistant',
        content: `Received your request. Let me analyze this and delegate to the appropriate team members...`,
        timestamp: new Date(),
        agentId: 'ceo',
      }
      addMessage(ackMessage)

      // Persist acknowledgment to Supabase
      if (isConfigured) {
        await saveMessage(ackMessage)
      }

      // Simulate delegation (for demo purposes)
      setTimeout(() => {
        setStreaming(false)
        updateAgentStatus('ceo', 'idle')
      }, 2000)
    }, 1000)
  }, [value, addMessage, addTask, updateAgentStatus, setStreaming, saveMessage, saveTask, isConfigured])

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
      e.preventDefault()
      handleSubmit()
    }
  }

  return (
    <div className="liquid-card">
      <motion.div
        className="relative"
        animate={{
          boxShadow: isFocused
            ? '0 0 20px rgba(0, 255, 240, 0.1)'
            : '0 0 0px rgba(0, 255, 240, 0)',
        }}
      >
        <textarea
          ref={textareaRef}
          value={value}
          onChange={e => setValue(e.target.value)}
          onKeyDown={handleKeyDown}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          placeholder="Describe a task for the agent team..."
          rows={3}
          className="chat-input w-full"
        />
      </motion.div>

      <div className="flex items-center justify-between mt-4">
        <span className="text-xs font-mono text-white/40">
          {typeof navigator !== 'undefined' && navigator.platform?.includes('Mac') ? '⌘' : 'Ctrl'} + Enter to send
        </span>

        <motion.button
          onClick={handleSubmit}
          disabled={!value.trim()}
          className="px-4 py-2 rounded-xl bg-accent/20 border border-accent/30 text-accent text-sm font-mono uppercase tracking-wider disabled:opacity-30 disabled:cursor-not-allowed"
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          Send
        </motion.button>
      </div>
    </div>
  )
}
