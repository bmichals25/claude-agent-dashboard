import { StyleSheet, View, Text } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { colors, fontSizes, spacing } from '@/src/lib/theme'
import { ChatPanel } from '@/src/components/ChatPanel'
import { ChatInput } from '@/src/components/ChatInput'

export default function ChatScreen() {
  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.title}>Chat</Text>
        <Text style={styles.subtitle}>Talk to the CEO</Text>
      </View>
      <View style={styles.chatContainer}>
        <ChatPanel />
      </View>
      <ChatInput />
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  title: {
    fontSize: fontSizes.xxl,
    fontWeight: '600',
    color: colors.text,
  },
  subtitle: {
    fontSize: fontSizes.sm,
    color: colors.textMuted,
    marginTop: spacing.xs,
  },
  chatContainer: {
    flex: 1,
  },
})
