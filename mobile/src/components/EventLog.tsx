import React from 'react'
import { StyleSheet, View, Text, FlatList } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import Animated, { FadeInRight } from 'react-native-reanimated'
import { colors, fontSizes, spacing, borderRadius, getEventTypeColor } from '@/src/lib/theme'
import { useDashboardStore } from '@/src/lib/store'
import { formatTime, getEventTypeIcon } from '@/src/lib/utils'
import type { AgentEvent } from '@/src/lib/types'

function EventItem({ event, index }: { event: AgentEvent; index: number }) {
  const { agents } = useDashboardStore()
  const agent = event.agentId ? agents.find(a => a.id === event.agentId) : null
  const eventColor = getEventTypeColor(event.type)
  const iconName = getEventTypeIcon(event.type) as keyof typeof Ionicons.glyphMap

  return (
    <Animated.View
      entering={FadeInRight.delay(index * 30).duration(200)}
      style={styles.eventItem}
    >
      {/* Icon */}
      <View style={[styles.iconContainer, { backgroundColor: eventColor + '20' }]}>
        <Ionicons name={iconName} size={16} color={eventColor} />
      </View>

      {/* Content */}
      <View style={styles.eventContent}>
        {/* Header row */}
        <View style={styles.eventHeader}>
          <Text style={styles.eventType}>
            {event.type.replace(/_/g, ' ').toUpperCase()}
          </Text>
          <Text style={styles.eventTime}>{formatTime(event.timestamp)}</Text>
        </View>

        {/* Message */}
        <Text style={styles.eventMessage}>{event.message}</Text>

        {/* Agent badge */}
        {agent && (
          <View style={styles.agentBadge}>
            <View style={[styles.agentDot, { backgroundColor: agent.color }]} />
            <Text style={[styles.agentName, { color: agent.color }]}>
              {agent.displayName}
            </Text>
          </View>
        )}
      </View>
    </Animated.View>
  )
}

function EmptyState() {
  return (
    <View style={styles.emptyContainer}>
      <Ionicons name="pulse-outline" size={48} color={colors.textMuted} />
      <Text style={styles.emptyTitle}>No events yet</Text>
      <Text style={styles.emptySubtitle}>
        Agent activity will appear here in real-time
      </Text>
    </View>
  )
}

export function EventLog() {
  const { events } = useDashboardStore()

  if (events.length === 0) {
    return <EmptyState />
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={events}
        keyExtractor={(item) => item.id}
        renderItem={({ item, index }) => <EventItem event={item} index={index} />}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        inverted={false}
      />
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  listContent: {
    padding: spacing.lg,
    paddingBottom: 120,
  },
  eventItem: {
    flexDirection: 'row',
    marginBottom: spacing.md,
    gap: spacing.md,
  },
  iconContainer: {
    width: 36,
    height: 36,
    borderRadius: borderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  eventContent: {
    flex: 1,
    backgroundColor: colors.glass,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.glassBorder,
    padding: spacing.md,
  },
  eventHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  eventType: {
    fontSize: fontSizes.xs,
    fontWeight: '700',
    color: colors.textMuted,
    letterSpacing: 0.5,
  },
  eventTime: {
    fontSize: fontSizes.xs,
    color: colors.textMuted,
  },
  eventMessage: {
    fontSize: fontSizes.sm,
    color: colors.text,
    lineHeight: 20,
  },
  agentBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.sm,
    gap: spacing.xs,
  },
  agentDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  agentName: {
    fontSize: fontSizes.xs,
    fontWeight: '600',
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
