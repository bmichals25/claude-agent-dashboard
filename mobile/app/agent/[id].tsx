import { StyleSheet, View, Text, ScrollView, Pressable } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useLocalSearchParams, router } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import { colors, fontSizes, spacing, borderRadius } from '@/src/lib/theme'
import { useDashboardStore } from '@/src/lib/store'
import { AgentAvatar } from '@/src/components/AgentAvatar'
import { getStatusLabel } from '@/src/lib/utils'
import type { AgentId } from '@/src/lib/types'

export default function AgentDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>()
  const { agents, tasks, taskHistory, setSelectedAgent } = useDashboardStore()

  const agent = agents.find(a => a.id === id)

  if (!agent) {
    return (
      <SafeAreaView style={styles.container}>
        <Text style={styles.errorText}>Agent not found</Text>
      </SafeAreaView>
    )
  }

  const reportsToAgent = agent.reportsTo
    ? agents.find(a => a.id === agent.reportsTo)
    : null

  const directReports = agents.filter(a =>
    agent.directReports.includes(a.id)
  )

  const activeTasks = tasks.filter(t => t.assignedTo === agent.id)
  const completedTasks = taskHistory.filter(t => t.assignedTo === agent.id)

  const navigateToAgent = (agentId: AgentId) => {
    setSelectedAgent(agentId)
    router.replace(`/agent/${agentId}`)
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.closeButton}>
          <Ionicons name="close" size={24} color={colors.text} />
        </Pressable>
        <Text style={styles.headerTitle}>Agent Details</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Avatar and Name */}
        <View style={styles.avatarSection}>
          <AgentAvatar agent={agent} size={100} />
          <Text style={styles.agentName}>{agent.displayName}</Text>
          <View style={[styles.tierBadge, { backgroundColor: agent.color + '20' }]}>
            <Text style={[styles.tierText, { color: agent.color }]}>
              {agent.tier.toUpperCase()}
            </Text>
          </View>
        </View>

        {/* Status */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Current Status</Text>
          <View style={styles.statusRow}>
            <View style={[styles.statusDot, { backgroundColor: agent.color }]} />
            <Text style={styles.statusText}>{getStatusLabel(agent.status)}</Text>
          </View>
        </View>

        {/* Specialty */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Specialty</Text>
          <Text style={styles.cardDescription}>{agent.specialty}</Text>
        </View>

        {/* Tools */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Tools</Text>
          <View style={styles.toolsContainer}>
            {agent.tools.map((tool, index) => (
              <View key={index} style={styles.toolBadge}>
                <Text style={styles.toolText}>{tool}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Reports To */}
        {reportsToAgent && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Reports To</Text>
            <Pressable
              style={styles.agentLink}
              onPress={() => navigateToAgent(reportsToAgent.id)}
            >
              <View style={[styles.agentLinkDot, { backgroundColor: reportsToAgent.color }]} />
              <Text style={styles.agentLinkText}>{reportsToAgent.displayName}</Text>
              <Ionicons name="chevron-forward" size={16} color={colors.textMuted} />
            </Pressable>
          </View>
        )}

        {/* Direct Reports */}
        {directReports.length > 0 && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Direct Reports ({directReports.length})</Text>
            {directReports.map(report => (
              <Pressable
                key={report.id}
                style={styles.agentLink}
                onPress={() => navigateToAgent(report.id)}
              >
                <View style={[styles.agentLinkDot, { backgroundColor: report.color }]} />
                <Text style={styles.agentLinkText}>{report.displayName}</Text>
                <Ionicons name="chevron-forward" size={16} color={colors.textMuted} />
              </Pressable>
            ))}
          </View>
        )}

        {/* Task Stats */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Task Statistics</Text>
          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Text style={[styles.statNumber, { color: colors.accent }]}>
                {activeTasks.length}
              </Text>
              <Text style={styles.statLabel}>Active</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={[styles.statNumber, { color: colors.accentGreen }]}>
                {completedTasks.length}
              </Text>
              <Text style={styles.statLabel}>Completed</Text>
            </View>
          </View>
        </View>

        {/* Bottom padding for tab bar */}
        <View style={{ height: 100 }} />
      </ScrollView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.glassBorder,
  },
  closeButton: {
    width: 40,
    height: 40,
    borderRadius: borderRadius.full,
    backgroundColor: colors.glass,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: fontSizes.lg,
    fontWeight: '600',
    color: colors.text,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: spacing.lg,
  },
  avatarSection: {
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  agentName: {
    fontSize: fontSizes.xxl,
    fontWeight: '700',
    color: colors.text,
    marginTop: spacing.md,
  },
  tierBadge: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.full,
    marginTop: spacing.sm,
  },
  tierText: {
    fontSize: fontSizes.xs,
    fontWeight: '700',
    letterSpacing: 1,
  },
  card: {
    backgroundColor: colors.glass,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.glassBorder,
    padding: spacing.lg,
    marginBottom: spacing.md,
  },
  cardTitle: {
    fontSize: fontSizes.sm,
    fontWeight: '600',
    color: colors.textMuted,
    marginBottom: spacing.sm,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  cardDescription: {
    fontSize: fontSizes.md,
    color: colors.text,
    lineHeight: 22,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: spacing.sm,
  },
  statusText: {
    fontSize: fontSizes.md,
    color: colors.text,
    fontWeight: '500',
  },
  toolsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  toolBadge: {
    backgroundColor: colors.surfaceLight,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.sm,
  },
  toolText: {
    fontSize: fontSizes.sm,
    color: colors.textSecondary,
  },
  agentLink: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.glassBorder,
  },
  agentLinkDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: spacing.sm,
  },
  agentLinkText: {
    flex: 1,
    fontSize: fontSizes.md,
    color: colors.text,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  statItem: {
    alignItems: 'center',
  },
  statNumber: {
    fontSize: fontSizes.xxxl,
    fontWeight: '700',
  },
  statLabel: {
    fontSize: fontSizes.sm,
    color: colors.textMuted,
    marginTop: spacing.xs,
  },
  errorText: {
    fontSize: fontSizes.lg,
    color: colors.text,
    textAlign: 'center',
    marginTop: 50,
  },
})
