import React from 'react'
import { StyleSheet, View, Text } from 'react-native'
import { colors, fontSizes, spacing, borderRadius } from '@/src/lib/theme'
import { isSupabaseConfigured } from '@/src/lib/supabase'

export function StatusIndicator() {
  const isConfigured = isSupabaseConfigured()

  return (
    <View style={[
      styles.container,
      { backgroundColor: isConfigured ? colors.accentGreen + '20' : colors.accentOrange + '20' }
    ]}>
      <View style={[
        styles.dot,
        { backgroundColor: isConfigured ? colors.accentGreen : colors.accentOrange }
      ]} />
      <Text style={[
        styles.text,
        { color: isConfigured ? colors.accentGreen : colors.accentOrange }
      ]}>
        {isConfigured ? 'Synced' : 'Local'}
      </Text>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.full,
    gap: spacing.xs,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  text: {
    fontSize: fontSizes.xs,
    fontWeight: '600',
  },
})
