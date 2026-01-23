import { StyleSheet, View, Text } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { colors, fontSizes, spacing } from '@/src/lib/theme'
import { TaskBoard } from '@/src/components/TaskBoard'

export default function TasksScreen() {
  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.title}>Tasks</Text>
      </View>
      <View style={styles.content}>
        <TaskBoard />
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
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  title: {
    fontSize: fontSizes.xxl,
    fontWeight: '600',
    color: colors.text,
  },
  content: {
    flex: 1,
  },
})
