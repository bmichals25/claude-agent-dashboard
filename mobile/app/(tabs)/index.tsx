import { StyleSheet, View, Text } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { colors, fontSizes, spacing } from '@/src/lib/theme'
import { AgentNetwork } from '@/src/components/AgentNetwork'
import { StatusIndicator } from '@/src/components/StatusIndicator'

export default function NetworkScreen() {
  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.title}>Agent Network</Text>
        <StatusIndicator />
      </View>
      <View style={styles.networkContainer}>
        <AgentNetwork />
      </View>
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
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  title: {
    fontSize: fontSizes.xxl,
    fontWeight: '600',
    color: colors.text,
  },
  networkContainer: {
    flex: 1,
  },
})
