import React from 'react'
import { StyleSheet, View, Pressable, useWindowDimensions } from 'react-native'
import Svg, { Line, Defs, LinearGradient, Stop } from 'react-native-svg'
import { router } from 'expo-router'
import Animated, { FadeIn } from 'react-native-reanimated'
import { useDashboardStore } from '@/src/lib/store'
import { AgentAvatar } from './AgentAvatar'
import { agentSizes, colors } from '@/src/lib/theme'
import type { Agent, AgentId } from '@/src/lib/types'

export function AgentNetwork() {
  const { width, height } = useWindowDimensions()
  const { agents, connections, activeConnections, setSelectedAgent } = useDashboardStore()

  // Calculate available height (subtract header and tab bar)
  const networkHeight = height - 200

  // Convert percentage position to actual coordinates
  const getPosition = (agent: Agent) => {
    const size = agentSizes[agent.tier]
    return {
      x: (agent.position.x / 100) * (width - size) + size / 2,
      y: (agent.position.y / 100) * (networkHeight - size) + size / 2,
    }
  }

  const handleAgentPress = (agentId: AgentId) => {
    setSelectedAgent(agentId)
    router.push(`/agent/${agentId}`)
  }

  // Get agent position by ID
  const getAgentPosition = (agentId: AgentId) => {
    const agent = agents.find(a => a.id === agentId)
    if (!agent) return { x: 0, y: 0 }
    return getPosition(agent)
  }

  return (
    <View style={[styles.container, { height: networkHeight }]}>
      {/* Connection lines */}
      <Svg style={StyleSheet.absoluteFill}>
        <Defs>
          <LinearGradient id="connectionGradient" x1="0%" y1="0%" x2="0%" y2="100%">
            <Stop offset="0%" stopColor={colors.accent} stopOpacity={0.6} />
            <Stop offset="100%" stopColor={colors.accentPurple} stopOpacity={0.3} />
          </LinearGradient>
          <LinearGradient id="activeGradient" x1="0%" y1="0%" x2="0%" y2="100%">
            <Stop offset="0%" stopColor={colors.accent} stopOpacity={1} />
            <Stop offset="100%" stopColor={colors.accentPink} stopOpacity={0.8} />
          </LinearGradient>
        </Defs>

        {connections.map((connection, index) => {
          const from = getAgentPosition(connection.from)
          const to = getAgentPosition(connection.to)
          const isActive = activeConnections.has(`${connection.from}-${connection.to}`)

          return (
            <Line
              key={`${connection.from}-${connection.to}-${index}`}
              x1={from.x}
              y1={from.y}
              x2={to.x}
              y2={to.y}
              stroke={isActive ? 'url(#activeGradient)' : 'url(#connectionGradient)'}
              strokeWidth={isActive ? 3 : 1.5}
              strokeOpacity={isActive ? 1 : 0.4}
            />
          )
        })}
      </Svg>

      {/* Agent nodes */}
      {agents.map((agent, index) => {
        const position = getPosition(agent)
        const size = agentSizes[agent.tier]

        return (
          <Animated.View
            key={agent.id}
            entering={FadeIn.delay(index * 50).duration(300)}
            style={[
              styles.agentNode,
              {
                left: position.x - size / 2,
                top: position.y - size / 2,
                width: size,
                height: size,
              },
            ]}
          >
            <Pressable
              onPress={() => handleAgentPress(agent.id)}
              style={styles.agentPressable}
            >
              <AgentAvatar agent={agent} size={size} />
            </Pressable>
          </Animated.View>
        )
      })}
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    position: 'relative',
  },
  agentNode: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
  agentPressable: {
    alignItems: 'center',
    justifyContent: 'center',
  },
})
