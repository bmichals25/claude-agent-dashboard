'use client'

import { motion, AnimatePresence } from 'motion/react'
import { useDashboardStore } from '@/lib/store'
import type { Task, TaskStatus } from '@/lib/types'
import { formatTimestamp, truncate } from '@/lib/utils'

const statusColumns: { status: TaskStatus; label: string; color: string }[] = [
  { status: 'pending', label: 'Pending', color: '#888' },
  { status: 'in_progress', label: 'In Progress', color: '#00fff0' },
  { status: 'delegated', label: 'Delegated', color: '#ff00c1' },
  { status: 'completed', label: 'Completed', color: '#00ff66' },
]

function TaskCard({ task }: { task: Task }) {
  const { agents } = useDashboardStore()
  const assignedAgent = agents.find(a => a.id === task.assignedTo)

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.9 }}
      className="bg-white/5 border border-white/10 rounded-xl p-3 mb-2"
    >
      <h4 className="text-sm text-white font-medium mb-1">
        {truncate(task.title, 40)}
      </h4>
      
      {assignedAgent && (
        <div className="flex items-center gap-2 mb-2">
          <div
            className="w-2 h-2 rounded-full"
            style={{ backgroundColor: assignedAgent.color }}
          />
          <span className="text-xs text-white/60 font-mono">
            {assignedAgent.displayName}
          </span>
        </div>
      )}

      <div className="flex items-center justify-between">
        <span
          className={`text-xs px-2 py-0.5 rounded-full ${
            task.priority === 'critical'
              ? 'bg-red-500/20 text-red-400'
              : task.priority === 'high'
              ? 'bg-orange-500/20 text-orange-400'
              : task.priority === 'medium'
              ? 'bg-yellow-500/20 text-yellow-400'
              : 'bg-gray-500/20 text-gray-400'
          }`}
        >
          {task.priority}
        </span>
        <span className="text-xs text-white/40 font-mono">
          {formatTimestamp(task.createdAt)}
        </span>
      </div>
    </motion.div>
  )
}

export function TaskBoard() {
  const { tasks, taskHistory, showTaskBoard, toggleTaskBoard } = useDashboardStore()

  const getTasksForStatus = (status: TaskStatus) => {
    if (status === 'completed') {
      return taskHistory.slice(-10).reverse() // Last 10 completed
    }
    return tasks.filter(t => t.status === status)
  }

  return (
    <>
      {/* Toggle Button */}
      <motion.button
        onClick={toggleTaskBoard}
        className="fixed top-6 right-6 z-50 px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-white/80 text-sm font-mono"
        whileHover={{ scale: 1.05, backgroundColor: 'rgba(255,255,255,0.1)' }}
        whileTap={{ scale: 0.95 }}
      >
        {showTaskBoard ? '← Hide Tasks' : 'Show Tasks →'}
      </motion.button>

      {/* Task Board Overlay */}
      <AnimatePresence>
        {showTaskBoard && (
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed top-0 right-0 w-[600px] h-full bg-bg/95 backdrop-blur-xl border-l border-white/10 z-40 overflow-hidden"
          >
            <div className="p-6 h-full flex flex-col">
              <h2 className="text-lg font-bold text-white mb-6">
                Agent Task Board
              </h2>

              <div className="flex-1 grid grid-cols-4 gap-4 overflow-hidden">
                {statusColumns.map(({ status, label, color }) => (
                  <div key={status} className="flex flex-col min-h-0">
                    <div className="flex items-center gap-2 mb-3">
                      <div
                        className="w-2 h-2 rounded-full"
                        style={{ backgroundColor: color }}
                      />
                      <h3 className="text-xs font-mono uppercase text-white/60">
                        {label}
                      </h3>
                      <span className="text-xs text-white/40">
                        ({getTasksForStatus(status).length})
                      </span>
                    </div>

                    <div className="flex-1 overflow-y-auto pr-1">
                      <AnimatePresence mode="popLayout">
                        {getTasksForStatus(status).map(task => (
                          <TaskCard key={task.id} task={task} />
                        ))}
                      </AnimatePresence>

                      {getTasksForStatus(status).length === 0 && (
                        <div className="text-xs text-white/30 text-center py-4">
                          No tasks
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
