'use client'

import { useCallback, useEffect, useRef } from 'react'
import { useDashboardStore } from '@/lib/store'

// Sound file paths (from public folder)
const SOUNDS = {
  click: '/sounds/click.mp3',
  success: '/sounds/success.mp3',
  error: '/sounds/error.mp3',
  notification: '/sounds/notification.mp3',
  toggle: '/sounds/toggle.mp3',
  send: '/sounds/send.mp3',
  nav: '/sounds/nav.mp3',
  messageSend: '/sounds/message-send.mp3',
  messageReceive: '/sounds/message-receive.mp3',
  panelOpen: '/sounds/panel-open.mp3',
} as const

type SoundType = keyof typeof SOUNDS

// Preloaded audio elements cache
const audioCache = new Map<string, HTMLAudioElement>()

// Check for reduced motion preference
function prefersReducedMotion(): boolean {
  if (typeof window === 'undefined') return false
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

// Preload all sounds
function preloadSounds() {
  if (typeof window === 'undefined') return

  Object.entries(SOUNDS).forEach(([key, src]) => {
    if (!audioCache.has(key)) {
      const audio = new Audio(src)
      audio.preload = 'auto'
      audio.volume = 0.5
      audioCache.set(key, audio)
    }
  })
}

/**
 * Hook for playing UI sound effects
 * Respects user's sound preference and reduced motion settings
 */
export function useSoundEffects() {
  const soundEnabled = useDashboardStore((state) => state.settings.soundEnabled)
  const soundVolume = useDashboardStore((state) => state.settings.soundVolume ?? 0.5)
  const hasInteracted = useRef(false)

  // Preload sounds on mount
  useEffect(() => {
    preloadSounds()
  }, [])

  // Track user interaction for autoplay policy
  useEffect(() => {
    const handleInteraction = () => {
      hasInteracted.current = true
    }

    window.addEventListener('click', handleInteraction, { once: true })
    window.addEventListener('keydown', handleInteraction, { once: true })

    return () => {
      window.removeEventListener('click', handleInteraction)
      window.removeEventListener('keydown', handleInteraction)
    }
  }, [])

  const playSound = useCallback((type: SoundType, volumeMultiplier: number = 1) => {
    // Don't play if disabled, reduced motion preferred, or no interaction yet
    if (!soundEnabled || prefersReducedMotion() || !hasInteracted.current) {
      return
    }

    const audio = audioCache.get(type)
    if (!audio) {
      // Fallback: create new audio element
      const newAudio = new Audio(SOUNDS[type])
      newAudio.volume = Math.min(1, soundVolume * volumeMultiplier)
      newAudio.play().catch(() => {
        // Ignore autoplay errors
      })
      return
    }

    // Clone and play for overlapping sounds support
    const clone = audio.cloneNode() as HTMLAudioElement
    clone.volume = Math.min(1, soundVolume * volumeMultiplier)
    clone.play().catch(() => {
      // Ignore autoplay errors
    })
  }, [soundEnabled, soundVolume])

  // Individual sound play functions
  const playClick = useCallback(() => playSound('click'), [playSound])
  const playSuccess = useCallback(() => playSound('success'), [playSound])
  const playError = useCallback(() => playSound('error'), [playSound])
  const playNotification = useCallback(() => playSound('notification'), [playSound])
  const playToggle = useCallback(() => playSound('toggle'), [playSound])
  const playSend = useCallback(() => playSound('send'), [playSound])
  const playNav = useCallback(() => playSound('nav'), [playSound])
  const playMessageSend = useCallback(() => playSound('messageSend'), [playSound])
  const playMessageReceive = useCallback(() => playSound('messageReceive'), [playSound])
  const playPanelOpen = useCallback(() => playSound('panelOpen'), [playSound])

  return {
    playClick,
    playSuccess,
    playError,
    playNotification,
    playToggle,
    playSend,
    playNav,
    playMessageSend,
    playMessageReceive,
    playPanelOpen,
    playSound,
    soundEnabled,
  }
}

export type { SoundType }
