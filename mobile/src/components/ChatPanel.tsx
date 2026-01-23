import React, { useRef, useEffect } from 'react'
import { StyleSheet, View, Text, FlatList } from 'react-native'
import Animated, { FadeInUp } from 'react-native-reanimated'
import { colors, fontSizes, spacing, borderRadius } from '@/src/lib/theme'
import { useDashboardStore } from '@/src/lib/store'
import { formatTime } from '@/src/lib/utils'
import type { Message } from '@/src/lib/types'

function MessageBubble({ message, index }: { message: Message; index: number }) {
  const isUser = message.role === 'user'
  const isSystem = message.role === 'system'

  return (
    <Animated.View
      entering={FadeInUp.delay(index * 50).duration(200).springify()}
      style={[
        styles.messageContainer,
        isUser && styles.messageContainerUser,
      ]}
    >
      <View
        style={[
          styles.messageBubble,
          isUser && styles.messageBubbleUser,
          isSystem && styles.messageBubbleSystem,
        ]}
      >
        {/* Agent badge for assistant messages */}
        {message.agentId && !isUser && (
          <View style={styles.agentBadge}>
            <Text style={styles.agentBadgeText}>
              {message.agentId.toUpperCase()}
            </Text>
          </View>
        )}

        <Text
          style={[
            styles.messageText,
            isUser && styles.messageTextUser,
            isSystem && styles.messageTextSystem,
          ]}
        >
          {message.content}
        </Text>

        <Text style={styles.timestamp}>
          {formatTime(message.timestamp)}
        </Text>
      </View>
    </Animated.View>
  )
}

function TypingIndicator() {
  return (
    <View style={styles.typingContainer}>
      <View style={styles.typingBubble}>
        <View style={styles.typingDots}>
          <Animated.View style={[styles.typingDot, { opacity: 0.4 }]} />
          <Animated.View style={[styles.typingDot, { opacity: 0.7 }]} />
          <Animated.View style={[styles.typingDot, { opacity: 1 }]} />
        </View>
      </View>
    </View>
  )
}

function EmptyState() {
  return (
    <View style={styles.emptyContainer}>
      <Text style={styles.emptyTitle}>No messages yet</Text>
      <Text style={styles.emptySubtitle}>
        Send a message to start talking with the CEO
      </Text>
    </View>
  )
}

export function ChatPanel() {
  const { messages, isStreaming } = useDashboardStore()
  const flatListRef = useRef<FlatList>(null)

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (messages.length > 0) {
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true })
      }, 100)
    }
  }, [messages.length])

  if (messages.length === 0 && !isStreaming) {
    return <EmptyState />
  }

  return (
    <View style={styles.container}>
      <FlatList
        ref={flatListRef}
        data={messages}
        keyExtractor={(item) => item.id}
        renderItem={({ item, index }) => (
          <MessageBubble message={item} index={index} />
        )}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        onContentSizeChange={() => {
          flatListRef.current?.scrollToEnd({ animated: true })
        }}
      />
      {isStreaming && <TypingIndicator />}
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  listContent: {
    padding: spacing.lg,
    paddingBottom: spacing.xxl,
  },
  messageContainer: {
    marginBottom: spacing.md,
    alignItems: 'flex-start',
  },
  messageContainerUser: {
    alignItems: 'flex-end',
  },
  messageBubble: {
    maxWidth: '85%',
    backgroundColor: colors.glass,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.glassBorder,
    padding: spacing.md,
  },
  messageBubbleUser: {
    backgroundColor: colors.accent + '20',
    borderColor: colors.accent + '40',
  },
  messageBubbleSystem: {
    backgroundColor: colors.accentOrange + '10',
    borderColor: colors.accentOrange + '30',
  },
  agentBadge: {
    backgroundColor: colors.accent + '30',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs / 2,
    borderRadius: borderRadius.sm,
    alignSelf: 'flex-start',
    marginBottom: spacing.xs,
  },
  agentBadgeText: {
    fontSize: fontSizes.xs,
    fontWeight: '700',
    color: colors.accent,
    letterSpacing: 0.5,
  },
  messageText: {
    fontSize: fontSizes.md,
    color: colors.text,
    lineHeight: 22,
  },
  messageTextUser: {
    color: colors.text,
  },
  messageTextSystem: {
    color: colors.accentOrange,
    fontStyle: 'italic',
  },
  timestamp: {
    fontSize: fontSizes.xs,
    color: colors.textMuted,
    marginTop: spacing.xs,
    alignSelf: 'flex-end',
  },
  typingContainer: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.lg,
  },
  typingBubble: {
    backgroundColor: colors.glass,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.glassBorder,
    padding: spacing.md,
    alignSelf: 'flex-start',
  },
  typingDots: {
    flexDirection: 'row',
    gap: spacing.xs,
  },
  typingDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.accent,
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
    marginBottom: spacing.sm,
  },
  emptySubtitle: {
    fontSize: fontSizes.md,
    color: colors.textMuted,
    textAlign: 'center',
  },
})
