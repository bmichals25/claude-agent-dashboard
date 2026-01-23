import React, { useState } from 'react'
import {
  StyleSheet,
  View,
  Text,
  FlatList,
  Pressable,
  ScrollView,
} from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import Animated, { FadeInDown, Layout } from 'react-native-reanimated'
import {
  colors,
  fontSizes,
  spacing,
  borderRadius,
  getPriorityColor,
  getTaskStatusColor,
} from '@/src/lib/theme'
import { useDashboardStore } from '@/src/lib/store'
import { formatRelativeTime, getPriorityLabel, getStatusLabel } from '@/src/lib/utils'
import type { Task, TaskStatus } from '@/src/lib/types'

type ViewMode = 'kanban' | 'list'

const STATUSES: TaskStatus[] = ['pending', 'in_progress', 'review', 'completed']

function TaskCard({ task, expanded, onToggle }: {
  task: Task
  expanded: boolean
  onToggle: () => void
}) {
  const { agents, projects } = useDashboardStore()

  const assignedAgent = agents.find(a => a.id === task.assignedTo)
  const project = projects.find(p => p.id === task.projectId)

  return (
    <Animated.View
      layout={Layout.springify()}
      entering={FadeInDown.duration(200)}
    >
      <Pressable onPress={onToggle} style={styles.taskCard}>
        {/* Priority indicator */}
        <View
          style={[
            styles.priorityBar,
            { backgroundColor: getPriorityColor(task.priority) },
          ]}
        />

        <View style={styles.taskContent}>
          {/* Header */}
          <View style={styles.taskHeader}>
            <Text style={styles.taskTitle} numberOfLines={expanded ? undefined : 1}>
              {task.title}
            </Text>
            <Ionicons
              name={expanded ? 'chevron-up' : 'chevron-down'}
              size={16}
              color={colors.textMuted}
            />
          </View>

          {/* Meta row */}
          <View style={styles.taskMeta}>
            {/* Priority badge */}
            <View
              style={[
                styles.badge,
                { backgroundColor: getPriorityColor(task.priority) + '20' },
              ]}
            >
              <Text
                style={[styles.badgeText, { color: getPriorityColor(task.priority) }]}
              >
                {getPriorityLabel(task.priority)}
              </Text>
            </View>

            {/* Agent badge */}
            {assignedAgent && (
              <View
                style={[
                  styles.badge,
                  { backgroundColor: assignedAgent.color + '20' },
                ]}
              >
                <View
                  style={[styles.agentDot, { backgroundColor: assignedAgent.color }]}
                />
                <Text
                  style={[styles.badgeText, { color: assignedAgent.color }]}
                  numberOfLines={1}
                >
                  {assignedAgent.displayName}
                </Text>
              </View>
            )}

            {/* Project badge */}
            {project && (
              <View
                style={[
                  styles.badge,
                  { backgroundColor: project.color + '20' },
                ]}
              >
                <Text style={[styles.badgeText, { color: project.color }]}>
                  {project.name}
                </Text>
              </View>
            )}
          </View>

          {/* Progress bar */}
          {task.progress > 0 && (
            <View style={styles.progressContainer}>
              <View style={styles.progressBar}>
                <Animated.View
                  style={[
                    styles.progressFill,
                    {
                      width: `${task.progress}%`,
                      backgroundColor: getTaskStatusColor(task.status),
                    },
                  ]}
                />
              </View>
              <Text style={styles.progressText}>{task.progress}%</Text>
            </View>
          )}

          {/* Expanded content */}
          {expanded && (
            <View style={styles.expandedContent}>
              {task.description && (
                <Text style={styles.description}>{task.description}</Text>
              )}

              {task.currentStep && (
                <View style={styles.currentStep}>
                  <Ionicons name="arrow-forward" size={12} color={colors.accent} />
                  <Text style={styles.currentStepText}>{task.currentStep}</Text>
                </View>
              )}

              {/* Stream entries */}
              {task.streamOutput && task.streamOutput.length > 0 && (
                <View style={styles.streamContainer}>
                  <Text style={styles.streamTitle}>Recent Activity</Text>
                  {task.streamOutput.slice(-3).map((entry) => (
                    <View key={entry.id} style={styles.streamEntry}>
                      <View
                        style={[
                          styles.streamDot,
                          {
                            backgroundColor:
                              entry.type === 'thought'
                                ? colors.accentOrange
                                : entry.type === 'action'
                                ? colors.accent
                                : entry.type === 'error'
                                ? colors.accentRed
                                : colors.accentGreen,
                          },
                        ]}
                      />
                      <Text style={styles.streamText} numberOfLines={2}>
                        {entry.content}
                      </Text>
                    </View>
                  ))}
                </View>
              )}

              <Text style={styles.timestamp}>
                Updated {formatRelativeTime(task.updatedAt)}
              </Text>
            </View>
          )}
        </View>
      </Pressable>
    </Animated.View>
  )
}

function KanbanColumn({ status, tasks }: { status: TaskStatus; tasks: Task[] }) {
  const [expandedTaskId, setExpandedTaskId] = useState<string | null>(null)

  return (
    <View style={styles.kanbanColumn}>
      <View style={styles.columnHeader}>
        <View
          style={[
            styles.columnStatusDot,
            { backgroundColor: getTaskStatusColor(status) },
          ]}
        />
        <Text style={styles.columnTitle}>{getStatusLabel(status)}</Text>
        <View style={styles.columnCount}>
          <Text style={styles.columnCountText}>{tasks.length}</Text>
        </View>
      </View>

      <ScrollView
        style={styles.columnContent}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.columnContentContainer}
      >
        {tasks.map((task) => (
          <TaskCard
            key={task.id}
            task={task}
            expanded={expandedTaskId === task.id}
            onToggle={() =>
              setExpandedTaskId(expandedTaskId === task.id ? null : task.id)
            }
          />
        ))}
        {tasks.length === 0 && (
          <Text style={styles.emptyColumnText}>No tasks</Text>
        )}
      </ScrollView>
    </View>
  )
}

export function TaskBoard() {
  const [viewMode, setViewMode] = useState<ViewMode>('list')
  const [expandedTaskId, setExpandedTaskId] = useState<string | null>(null)
  const { tasks, getSortedFilteredTasks, taskHistory } = useDashboardStore()

  const sortedTasks = getSortedFilteredTasks()
  const allTasks = [...sortedTasks, ...taskHistory.slice(-5)]

  // Group tasks by status for kanban view
  const tasksByStatus = STATUSES.reduce((acc, status) => {
    acc[status] = allTasks.filter((t) => t.status === status)
    return acc
  }, {} as Record<TaskStatus, Task[]>)

  if (allTasks.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Ionicons name="checkbox-outline" size={48} color={colors.textMuted} />
        <Text style={styles.emptyTitle}>No tasks yet</Text>
        <Text style={styles.emptySubtitle}>
          Tasks created from chat will appear here
        </Text>
      </View>
    )
  }

  return (
    <View style={styles.container}>
      {/* View mode toggle */}
      <View style={styles.header}>
        <Pressable
          onPress={() => setViewMode('list')}
          style={[
            styles.viewToggle,
            viewMode === 'list' && styles.viewToggleActive,
          ]}
        >
          <Ionicons
            name="list"
            size={18}
            color={viewMode === 'list' ? colors.accent : colors.textMuted}
          />
        </Pressable>
        <Pressable
          onPress={() => setViewMode('kanban')}
          style={[
            styles.viewToggle,
            viewMode === 'kanban' && styles.viewToggleActive,
          ]}
        >
          <Ionicons
            name="grid"
            size={18}
            color={viewMode === 'kanban' ? colors.accent : colors.textMuted}
          />
        </Pressable>
      </View>

      {viewMode === 'list' ? (
        <FlatList
          data={allTasks}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <TaskCard
              task={item}
              expanded={expandedTaskId === item.id}
              onToggle={() =>
                setExpandedTaskId(expandedTaskId === item.id ? null : item.id)
              }
            />
          )}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        />
      ) : (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.kanbanContainer}
        >
          {STATUSES.map((status) => (
            <KanbanColumn
              key={status}
              status={status}
              tasks={tasksByStatus[status]}
            />
          ))}
        </ScrollView>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    gap: spacing.sm,
  },
  viewToggle: {
    padding: spacing.sm,
    borderRadius: borderRadius.sm,
    backgroundColor: colors.glass,
  },
  viewToggleActive: {
    backgroundColor: colors.accent + '20',
  },
  listContent: {
    padding: spacing.lg,
    paddingBottom: 120,
  },
  taskCard: {
    flexDirection: 'row',
    backgroundColor: colors.glass,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.glassBorder,
    marginBottom: spacing.md,
    overflow: 'hidden',
  },
  priorityBar: {
    width: 4,
  },
  taskContent: {
    flex: 1,
    padding: spacing.md,
  },
  taskHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: spacing.sm,
  },
  taskTitle: {
    flex: 1,
    fontSize: fontSizes.md,
    fontWeight: '600',
    color: colors.text,
  },
  taskMeta: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
    marginTop: spacing.sm,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs / 2,
    borderRadius: borderRadius.sm,
    gap: spacing.xs,
  },
  badgeText: {
    fontSize: fontSizes.xs,
    fontWeight: '600',
  },
  agentDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.sm,
    gap: spacing.sm,
  },
  progressBar: {
    flex: 1,
    height: 4,
    backgroundColor: colors.surfaceLight,
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 2,
  },
  progressText: {
    fontSize: fontSizes.xs,
    color: colors.textMuted,
    width: 35,
    textAlign: 'right',
  },
  expandedContent: {
    marginTop: spacing.md,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.glassBorder,
  },
  description: {
    fontSize: fontSizes.sm,
    color: colors.textSecondary,
    lineHeight: 20,
    marginBottom: spacing.sm,
  },
  currentStep: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginBottom: spacing.sm,
  },
  currentStepText: {
    fontSize: fontSizes.sm,
    color: colors.accent,
  },
  streamContainer: {
    marginTop: spacing.sm,
  },
  streamTitle: {
    fontSize: fontSizes.xs,
    fontWeight: '600',
    color: colors.textMuted,
    marginBottom: spacing.xs,
    textTransform: 'uppercase',
  },
  streamEntry: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.xs,
    marginBottom: spacing.xs,
  },
  streamDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginTop: 5,
  },
  streamText: {
    flex: 1,
    fontSize: fontSizes.xs,
    color: colors.textSecondary,
    lineHeight: 16,
  },
  timestamp: {
    fontSize: fontSizes.xs,
    color: colors.textMuted,
    marginTop: spacing.sm,
  },
  kanbanContainer: {
    paddingHorizontal: spacing.lg,
    paddingBottom: 120,
  },
  kanbanColumn: {
    width: 280,
    marginRight: spacing.md,
  },
  columnHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
    gap: spacing.sm,
  },
  columnStatusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  columnTitle: {
    flex: 1,
    fontSize: fontSizes.sm,
    fontWeight: '600',
    color: colors.text,
  },
  columnCount: {
    backgroundColor: colors.surfaceLight,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs / 2,
    borderRadius: borderRadius.full,
  },
  columnCountText: {
    fontSize: fontSizes.xs,
    color: colors.textMuted,
    fontWeight: '600',
  },
  columnContent: {
    flex: 1,
  },
  columnContentContainer: {
    paddingBottom: spacing.lg,
  },
  emptyColumnText: {
    fontSize: fontSizes.sm,
    color: colors.textMuted,
    textAlign: 'center',
    paddingVertical: spacing.xl,
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
  },
  emptyTitle: {
    fontSize: fontSizes.xl,
    fontWeight: '600',
    color: colors.textSecondary,
    marginTop: spacing.md,
    marginBottom: spacing.sm,
  },
  emptySubtitle: {
    fontSize: fontSizes.md,
    color: colors.textMuted,
    textAlign: 'center',
  },
})
