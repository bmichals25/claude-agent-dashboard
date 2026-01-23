import React, { useState } from 'react'
import {
  StyleSheet,
  View,
  TextInput,
  Pressable,
  Text,
  KeyboardAvoidingView,
  Platform,
} from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { colors, fontSizes, spacing, borderRadius } from '@/src/lib/theme'
import { useDashboardStore } from '@/src/lib/store'
import { generateUUID } from '@/src/lib/utils'

export function ChatInput() {
  const [message, setMessage] = useState('')
  const [isFocused, setIsFocused] = useState(false)

  const {
    addMessage,
    addTask,
    updateAgentStatus,
    addStreamEntry,
    setStreaming,
  } = useDashboardStore()

  const handleSubmit = async () => {
    if (!message.trim()) return

    const userMessage = {
      id: generateUUID(),
      role: 'user' as const,
      content: message.trim(),
      timestamp: new Date(),
    }

    // Add user message
    addMessage(userMessage)
    setMessage('')
    setStreaming(true)

    // Create task from message
    const taskId = generateUUID()
    const task = {
      id: taskId,
      title: message.trim().slice(0, 50) + (message.length > 50 ? '...' : ''),
      description: message.trim(),
      status: 'pending' as const,
      priority: 'medium' as const,
      assignedTo: 'ceo' as const,
      projectId: null,
      createdAt: new Date(),
      updatedAt: new Date(),
      streamOutput: [],
      progress: 0,
    }

    addTask(task)

    // Simulate CEO thinking
    updateAgentStatus('ceo', 'thinking', task)

    // Add stream entries with delays
    setTimeout(() => {
      addStreamEntry(taskId, {
        id: generateUUID(),
        timestamp: new Date(),
        agentId: 'ceo',
        type: 'thought',
        content: 'Analyzing request and determining the best approach...',
      })
    }, 500)

    setTimeout(() => {
      addStreamEntry(taskId, {
        id: generateUUID(),
        timestamp: new Date(),
        agentId: 'ceo',
        type: 'action',
        content: 'Breaking down task into subtasks for delegation...',
      })
      updateAgentStatus('ceo', 'delegating', task)
    }, 1500)

    // Add assistant response
    setTimeout(() => {
      const assistantMessage = {
        id: generateUUID(),
        role: 'assistant' as const,
        content: `I've received your request: "${message.trim().slice(0, 100)}${message.length > 100 ? '...' : ''}"\n\nI'm analyzing this task and will delegate to the appropriate team members.`,
        timestamp: new Date(),
        agentId: 'ceo' as const,
      }

      addMessage(assistantMessage)
      updateAgentStatus('ceo', 'working', task)
      setStreaming(false)
    }, 2500)
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
      style={styles.keyboardAvoid}
    >
      <View style={styles.container}>
        <View
          style={[
            styles.inputContainer,
            isFocused && styles.inputContainerFocused,
          ]}
        >
          <TextInput
            style={styles.input}
            placeholder="Send a message to the CEO..."
            placeholderTextColor={colors.textMuted}
            value={message}
            onChangeText={setMessage}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            onSubmitEditing={handleSubmit}
            multiline
            maxLength={2000}
            returnKeyType="send"
            blurOnSubmit
          />

          <Pressable
            onPress={handleSubmit}
            disabled={!message.trim()}
            style={({ pressed }) => [
              styles.sendButton,
              !message.trim() && styles.sendButtonDisabled,
              pressed && styles.sendButtonPressed,
            ]}
          >
            <Ionicons
              name="send"
              size={20}
              color={message.trim() ? colors.background : colors.textMuted}
            />
          </Pressable>
        </View>

        <Text style={styles.hint}>Press Enter to send</Text>
      </View>
    </KeyboardAvoidingView>
  )
}

const styles = StyleSheet.create({
  keyboardAvoid: {
    width: '100%',
  },
  container: {
    padding: spacing.lg,
    paddingBottom: Platform.OS === 'ios' ? spacing.xxl + 20 : spacing.lg,
    backgroundColor: colors.background,
    borderTopWidth: 1,
    borderTopColor: colors.glassBorder,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    backgroundColor: colors.glass,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.glassBorder,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    gap: spacing.sm,
  },
  inputContainerFocused: {
    borderColor: colors.accent + '60',
    shadowColor: colors.accent,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  input: {
    flex: 1,
    fontSize: fontSizes.md,
    color: colors.text,
    maxHeight: 100,
    paddingVertical: spacing.xs,
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: borderRadius.full,
    backgroundColor: colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendButtonDisabled: {
    backgroundColor: colors.surfaceLight,
  },
  sendButtonPressed: {
    opacity: 0.8,
    transform: [{ scale: 0.95 }],
  },
  hint: {
    fontSize: fontSizes.xs,
    color: colors.textMuted,
    textAlign: 'center',
    marginTop: spacing.sm,
  },
})
