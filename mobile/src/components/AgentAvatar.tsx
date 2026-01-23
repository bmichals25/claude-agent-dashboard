import React, { useEffect } from 'react'
import { StyleSheet, View } from 'react-native'
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  withSequence,
  withSpring,
  Easing,
  interpolate,
} from 'react-native-reanimated'
import { colors, agentSizes, getStatusColor } from '@/src/lib/theme'
import type { Agent } from '@/src/lib/types'

interface AgentAvatarProps {
  agent: Agent
  size?: number
  showStatusRing?: boolean
}

export function AgentAvatar({ agent, size, showStatusRing = true }: AgentAvatarProps) {
  const avatarSize = size || agentSizes[agent.tier]
  const isActive = agent.status !== 'idle'

  // Animation values
  const morphProgress = useSharedValue(0)
  const pulseProgress = useSharedValue(1)
  const eyeBlinkProgress = useSharedValue(1)
  const glowIntensity = useSharedValue(isActive ? 1 : 0.3)

  // Start animations
  useEffect(() => {
    // Morphing blob animation
    morphProgress.value = withRepeat(
      withTiming(1, { duration: 6000, easing: Easing.inOut(Easing.sin) }),
      -1,
      true
    )

    // Pulse animation when active
    if (isActive) {
      pulseProgress.value = withRepeat(
        withSequence(
          withTiming(1.15, { duration: 1000, easing: Easing.inOut(Easing.sin) }),
          withTiming(1, { duration: 1000, easing: Easing.inOut(Easing.sin) })
        ),
        -1,
        false
      )
    } else {
      pulseProgress.value = withSpring(1)
    }

    // Eye blinking
    eyeBlinkProgress.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 2500 }),
        withTiming(0.1, { duration: 100 }),
        withTiming(1, { duration: 100 }),
        withTiming(1, { duration: 500 })
      ),
      -1,
      false
    )

    // Glow intensity based on status
    glowIntensity.value = withSpring(isActive ? 1 : 0.3)
  }, [isActive])

  // Blob container style
  const blobContainerStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulseProgress.value }],
  }))

  // Blob shape animation (simulating morph with border radius)
  const blobStyle = useAnimatedStyle(() => {
    const morph = morphProgress.value
    return {
      borderTopLeftRadius: interpolate(morph, [0, 0.5, 1], [50, 45, 50]) * (avatarSize / 100),
      borderTopRightRadius: interpolate(morph, [0, 0.5, 1], [50, 55, 50]) * (avatarSize / 100),
      borderBottomLeftRadius: interpolate(morph, [0, 0.5, 1], [50, 55, 50]) * (avatarSize / 100),
      borderBottomRightRadius: interpolate(morph, [0, 0.5, 1], [50, 45, 50]) * (avatarSize / 100),
    }
  })

  // Eye animation
  const eyeStyle = useAnimatedStyle(() => ({
    transform: [{ scaleY: eyeBlinkProgress.value }],
  }))

  // Glow effect
  const glowStyle = useAnimatedStyle(() => ({
    opacity: glowIntensity.value * 0.5,
    transform: [{ scale: 1.3 }],
  }))

  const statusColor = getStatusColor(agent.status)
  const eyeSize = avatarSize * 0.12
  const eyeSpacing = avatarSize * 0.2

  return (
    <View style={[styles.container, { width: avatarSize, height: avatarSize }]}>
      {/* Glow effect */}
      <Animated.View
        style={[
          styles.glow,
          glowStyle,
          {
            width: avatarSize,
            height: avatarSize,
            borderRadius: avatarSize / 2,
            backgroundColor: agent.color,
          },
        ]}
      />

      {/* Main blob */}
      <Animated.View style={[styles.blobContainer, blobContainerStyle]}>
        <Animated.View
          style={[
            styles.blob,
            blobStyle,
            {
              width: avatarSize,
              height: avatarSize,
              backgroundColor: agent.color + '40',
              borderWidth: 2,
              borderColor: agent.color + '80',
            },
          ]}
        >
          {/* Face container */}
          <View style={styles.faceContainer}>
            {/* Eyes */}
            <View style={[styles.eyesContainer, { gap: eyeSpacing }]}>
              <Animated.View
                style={[
                  styles.eye,
                  eyeStyle,
                  {
                    width: eyeSize,
                    height: eyeSize,
                    borderRadius: eyeSize / 2,
                    backgroundColor: colors.text,
                  },
                ]}
              />
              <Animated.View
                style={[
                  styles.eye,
                  eyeStyle,
                  {
                    width: eyeSize,
                    height: eyeSize,
                    borderRadius: eyeSize / 2,
                    backgroundColor: colors.text,
                  },
                ]}
              />
            </View>

            {/* Mouth */}
            {isActive && (
              <View
                style={[
                  styles.mouth,
                  {
                    width: avatarSize * 0.2,
                    height: avatarSize * 0.06,
                    borderRadius: avatarSize * 0.03,
                    backgroundColor: colors.text,
                    marginTop: avatarSize * 0.08,
                  },
                ]}
              />
            )}
          </View>
        </Animated.View>
      </Animated.View>

      {/* Status ring */}
      {showStatusRing && isActive && (
        <View
          style={[
            styles.statusRing,
            {
              width: avatarSize + 8,
              height: avatarSize + 8,
              borderRadius: (avatarSize + 8) / 2,
              borderColor: statusColor,
            },
          ]}
        />
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  glow: {
    position: 'absolute',
  },
  blobContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  blob: {
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  faceContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  eyesContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  eye: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 1,
  },
  mouth: {
    opacity: 0.8,
  },
  statusRing: {
    position: 'absolute',
    borderWidth: 2,
  },
})
