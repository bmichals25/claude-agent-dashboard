'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { useDashboardStore } from '@/lib/store'
import { useSoundEffects } from '@/hooks/useSoundEffects'

// Preset accent colors
const ACCENT_COLORS = [
  { name: 'Cyan', value: '#00fff0' },
  { name: 'Orange', value: '#ff6b35' },
  { name: 'Purple', value: '#7c3aed' },
  { name: 'Green', value: '#22c55e' },
  { name: 'Pink', value: '#ec4899' },
  { name: 'Blue', value: '#3b82f6' },
  { name: 'Yellow', value: '#eab308' },
  { name: 'Red', value: '#ef4444' },
]

// Settings sections
const SECTIONS = [
  { id: 'branding', label: 'Branding', icon: '✦' },
  { id: 'appearance', label: 'Appearance', icon: '◐' },
  { id: 'notifications', label: 'Notifications', icon: '◉' },
  { id: 'chat', label: 'Chat', icon: '◈' },
  { id: 'danger', label: 'Danger Zone', icon: '⚠' },
] as const

type SectionId = typeof SECTIONS[number]['id']

function SettingRow({
  label,
  description,
  children,
  isLast = false,
}: {
  label: string
  description?: string
  children: React.ReactNode
  isLast?: boolean
}) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '20px 24px',
        borderBottom: isLast ? 'none' : '1px solid var(--glass-border)',
      }}
    >
      <div style={{ flex: 1 }}>
        <div
          style={{
            fontSize: '14px',
            fontWeight: 500,
            color: 'var(--text-main)',
            marginBottom: description ? '4px' : 0,
          }}
        >
          {label}
        </div>
        {description && (
          <div
            style={{
              fontSize: '12px',
              color: 'var(--text-dim)',
            }}
          >
            {description}
          </div>
        )}
      </div>
      <div>{children}</div>
    </div>
  )
}

function Toggle({
  enabled,
  onChange,
  color = 'var(--accent)',
  onToggle,
}: {
  enabled: boolean
  onChange: (enabled: boolean) => void
  color?: string
  onToggle?: () => void
}) {
  return (
    <button
      onClick={() => {
        onToggle?.()
        onChange(!enabled)
      }}
      style={{
        width: '44px',
        height: '24px',
        borderRadius: '12px',
        background: enabled ? color : 'var(--glass)',
        border: `1px solid ${enabled ? color : 'var(--glass-border)'}`,
        cursor: 'pointer',
        position: 'relative',
        transition: 'all 0.2s ease',
      }}
    >
      <motion.div
        animate={{
          x: enabled ? 20 : 0,
        }}
        transition={{ type: 'spring', stiffness: 500, damping: 30 }}
        style={{
          width: '20px',
          height: '20px',
          borderRadius: '10px',
          background: enabled ? 'var(--bg)' : 'var(--text-dim)',
          position: 'absolute',
          top: '1px',
          left: '1px',
        }}
      />
    </button>
  )
}

export function SettingsPage() {
  const { settings, updateSettings, resetSettings } = useDashboardStore()
  const { playToggle, playClick } = useSoundEffects()
  const [activeSection, setActiveSection] = useState<SectionId>('branding')

  const handleNameChange = (value: string) => {
    updateSettings({ appName: value })
  }

  const handleTaglineChange = (value: string) => {
    updateSettings({ appTagline: value })
  }

  const handleColorChange = (color: string) => {
    playClick()
    updateSettings({ accentColor: color })
  }

  const handleVolumeChange = (volume: number) => {
    updateSettings({ soundVolume: volume })
  }

  return (
    <div className="h-full w-full overflow-y-auto scrollbar-fade">
      <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '48px 56px 120px' }}>
        {/* Header */}
        <motion.header
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          style={{ marginBottom: '48px' }}
        >
          <h1
            style={{
              fontSize: '32px',
              fontWeight: 700,
              color: 'var(--text-main)',
              letterSpacing: '-0.02em',
              lineHeight: 1.2,
            }}
          >
            Settings
          </h1>
          <p
            style={{
              fontSize: '14px',
              fontFamily: '"JetBrains Mono", ui-monospace, monospace',
              color: 'var(--text-dim)',
              marginTop: '6px',
              letterSpacing: '0.02em',
            }}
          >
            Customize your dashboard experience
          </p>
        </motion.header>

        {/* Two Column Layout */}
        <div style={{ display: 'flex', gap: '48px' }}>
          {/* Left Navigation */}
          <motion.nav
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            style={{
              width: '220px',
              flexShrink: 0,
            }}
          >
            <div
              style={{
                position: 'sticky',
                top: '48px',
                display: 'flex',
                flexDirection: 'column',
                gap: '4px',
              }}
            >
              {SECTIONS.map((section) => {
                const isActive = activeSection === section.id
                const isDanger = section.id === 'danger'
                return (
                  <button
                    key={section.id}
                    onClick={() => {
                      playClick()
                      setActiveSection(section.id)
                    }}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '12px',
                      padding: '12px 16px',
                      borderRadius: '12px',
                      border: 'none',
                      background: isActive
                        ? isDanger ? 'rgba(239, 68, 68, 0.1)' : 'var(--bg-elevated)'
                        : 'transparent',
                      cursor: 'pointer',
                      transition: 'all 0.15s ease',
                      textAlign: 'left',
                    }}
                  >
                    <span
                      style={{
                        fontSize: '14px',
                        opacity: isActive ? 1 : 0.5,
                        color: isDanger ? 'var(--error)' : 'var(--text-main)',
                      }}
                    >
                      {section.icon}
                    </span>
                    <span
                      style={{
                        fontSize: '14px',
                        fontWeight: isActive ? 600 : 400,
                        color: isActive
                          ? isDanger ? 'var(--error)' : 'var(--text-main)'
                          : 'var(--text-secondary)',
                      }}
                    >
                      {section.label}
                    </span>
                    {isActive && (
                      <motion.div
                        layoutId="activeIndicator"
                        style={{
                          marginLeft: 'auto',
                          width: '4px',
                          height: '4px',
                          borderRadius: '2px',
                          background: isDanger ? 'var(--error)' : settings.accentColor,
                        }}
                      />
                    )}
                  </button>
                )
              })}

              {/* Version info */}
              <div
                style={{
                  marginTop: '32px',
                  padding: '16px',
                  fontSize: '11px',
                  fontFamily: 'ui-monospace, monospace',
                  color: 'var(--text-muted)',
                }}
              >
                v1.0.0
              </div>
            </div>
          </motion.nav>

          {/* Right Content */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            style={{ flex: 1, maxWidth: '640px' }}
          >
            <AnimatePresence mode="wait">
              {/* Branding Section */}
              {activeSection === 'branding' && (
                <motion.div
                  key="branding"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.2 }}
                >
                  <h2 style={{ fontSize: '18px', fontWeight: 600, color: 'var(--text-main)', marginBottom: '24px' }}>
                    Branding
                  </h2>
                  <div
                    style={{
                      background: 'var(--bg-elevated)',
                      border: '1px solid var(--glass-border)',
                      borderRadius: '16px',
                      overflow: 'hidden',
                    }}
                  >
                    <SettingRow label="App Name" description="The name displayed in the header">
                      <input
                        type="text"
                        value={settings.appName}
                        onChange={(e) => handleNameChange(e.target.value)}
                        style={{
                          width: '200px',
                          padding: '8px 12px',
                          borderRadius: '8px',
                          border: '1px solid var(--glass-border)',
                          background: 'var(--bg-surface)',
                          color: 'var(--text-main)',
                          fontSize: '13px',
                          outline: 'none',
                          transition: 'border-color 0.2s ease',
                        }}
                        onFocus={(e) => {
                          e.target.style.borderColor = settings.accentColor
                        }}
                        onBlur={(e) => {
                          e.target.style.borderColor = 'var(--glass-border)'
                        }}
                      />
                    </SettingRow>
                    <SettingRow label="Tagline" description="Subtitle shown below the name" isLast>
                      <input
                        type="text"
                        value={settings.appTagline}
                        onChange={(e) => handleTaglineChange(e.target.value)}
                        style={{
                          width: '200px',
                          padding: '8px 12px',
                          borderRadius: '8px',
                          border: '1px solid var(--glass-border)',
                          background: 'var(--bg-surface)',
                          color: 'var(--text-main)',
                          fontSize: '13px',
                          outline: 'none',
                          transition: 'border-color 0.2s ease',
                        }}
                        onFocus={(e) => {
                          e.target.style.borderColor = settings.accentColor
                        }}
                        onBlur={(e) => {
                          e.target.style.borderColor = 'var(--glass-border)'
                        }}
                      />
                    </SettingRow>
                  </div>
                </motion.div>
              )}

              {/* Appearance Section */}
              {activeSection === 'appearance' && (
                <motion.div
                  key="appearance"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.2 }}
                >
                  <h2 style={{ fontSize: '18px', fontWeight: 600, color: 'var(--text-main)', marginBottom: '24px' }}>
                    Appearance
                  </h2>
                  <div
                    style={{
                      background: 'var(--bg-elevated)',
                      border: '1px solid var(--glass-border)',
                      borderRadius: '16px',
                      overflow: 'hidden',
                    }}
                  >
                    <SettingRow label="Accent Color" description="Primary color used throughout the app">
                      <div style={{ display: 'flex', gap: '8px' }}>
                        {ACCENT_COLORS.map((color) => (
                          <button
                            key={color.value}
                            onClick={() => handleColorChange(color.value)}
                            title={color.name}
                            style={{
                              width: '28px',
                              height: '28px',
                              borderRadius: '8px',
                              background: color.value,
                              border: settings.accentColor === color.value
                                ? '2px solid var(--text-main)'
                                : '2px solid transparent',
                              cursor: 'pointer',
                              transition: 'all 0.15s ease',
                              boxShadow: settings.accentColor === color.value
                                ? `0 0 12px ${color.value}60`
                                : 'none',
                            }}
                          />
                        ))}
                      </div>
                    </SettingRow>
                    <SettingRow label="Theme" description="Color scheme for the interface" isLast>
                      <select
                        value={settings.theme}
                        onChange={(e) => updateSettings({ theme: e.target.value as 'dark' | 'light' | 'system' })}
                        style={{
                          padding: '8px 12px',
                          borderRadius: '8px',
                          border: '1px solid var(--glass-border)',
                          background: 'var(--bg-surface)',
                          color: 'var(--text-main)',
                          fontSize: '13px',
                          outline: 'none',
                          cursor: 'pointer',
                        }}
                      >
                        <option value="dark">Dark</option>
                        <option value="light">Light (Coming Soon)</option>
                        <option value="system">System</option>
                      </select>
                    </SettingRow>
                  </div>
                </motion.div>
              )}

              {/* Notifications Section */}
              {activeSection === 'notifications' && (
                <motion.div
                  key="notifications"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.2 }}
                >
                  <h2 style={{ fontSize: '18px', fontWeight: 600, color: 'var(--text-main)', marginBottom: '24px' }}>
                    Notifications
                  </h2>
                  <div
                    style={{
                      background: 'var(--bg-elevated)',
                      border: '1px solid var(--glass-border)',
                      borderRadius: '16px',
                      overflow: 'hidden',
                    }}
                  >
                    <SettingRow label="Show Notifications" description="Display event notifications at the bottom">
                      <Toggle
                        enabled={settings.showNotifications}
                        onChange={(enabled) => updateSettings({ showNotifications: enabled })}
                        color={settings.accentColor}
                        onToggle={playToggle}
                      />
                    </SettingRow>
                    <SettingRow label="Sound Effects" description="Play sounds for UI interactions">
                      <Toggle
                        enabled={settings.soundEnabled}
                        onChange={(enabled) => updateSettings({ soundEnabled: enabled })}
                        color={settings.accentColor}
                        onToggle={playToggle}
                      />
                    </SettingRow>
                    <SettingRow label="Volume" description="Adjust sound effect volume" isLast>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <input
                          type="range"
                          min="0"
                          max="1"
                          step="0.1"
                          value={settings.soundVolume}
                          onChange={(e) => handleVolumeChange(parseFloat(e.target.value))}
                          disabled={!settings.soundEnabled}
                          style={{
                            width: '100px',
                            accentColor: settings.accentColor,
                            cursor: settings.soundEnabled ? 'pointer' : 'not-allowed',
                            opacity: settings.soundEnabled ? 1 : 0.5,
                          }}
                        />
                        <span
                          style={{
                            fontSize: '12px',
                            fontFamily: 'ui-monospace, monospace',
                            color: 'var(--text-secondary)',
                            minWidth: '36px',
                            opacity: settings.soundEnabled ? 1 : 0.5,
                          }}
                        >
                          {Math.round(settings.soundVolume * 100)}%
                        </span>
                      </div>
                    </SettingRow>
                  </div>
                </motion.div>
              )}

              {/* Chat Section */}
              {activeSection === 'chat' && (
                <motion.div
                  key="chat"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.2 }}
                >
                  <h2 style={{ fontSize: '18px', fontWeight: 600, color: 'var(--text-main)', marginBottom: '24px' }}>
                    Chat
                  </h2>
                  <div
                    style={{
                      background: 'var(--bg-elevated)',
                      border: '1px solid var(--glass-border)',
                      borderRadius: '16px',
                      overflow: 'hidden',
                    }}
                  >
                    <SettingRow label="Auto-scroll" description="Automatically scroll to new messages" isLast>
                      <Toggle
                        enabled={settings.autoScrollChat}
                        onChange={(enabled) => updateSettings({ autoScrollChat: enabled })}
                        color={settings.accentColor}
                        onToggle={playToggle}
                      />
                    </SettingRow>
                  </div>
                </motion.div>
              )}

              {/* Danger Zone Section */}
              {activeSection === 'danger' && (
                <motion.div
                  key="danger"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.2 }}
                >
                  <h2 style={{ fontSize: '18px', fontWeight: 600, color: 'var(--error)', marginBottom: '24px' }}>
                    Danger Zone
                  </h2>
                  <div
                    style={{
                      background: 'var(--bg-elevated)',
                      border: '1px solid rgba(239, 68, 68, 0.3)',
                      borderRadius: '16px',
                      overflow: 'hidden',
                    }}
                  >
                    <SettingRow label="Reset Settings" description="Restore all settings to defaults" isLast>
                      <button
                        onClick={() => {
                          if (confirm('Are you sure you want to reset all settings?')) {
                            resetSettings()
                          }
                        }}
                        style={{
                          padding: '8px 16px',
                          borderRadius: '8px',
                          background: 'transparent',
                          color: 'var(--error)',
                          fontSize: '13px',
                          fontWeight: 500,
                          border: '1px solid var(--error)',
                          cursor: 'pointer',
                          transition: 'all 0.15s ease',
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.background = 'var(--error)'
                          e.currentTarget.style.color = 'var(--bg)'
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.background = 'transparent'
                          e.currentTarget.style.color = 'var(--error)'
                        }}
                      >
                        Reset All Settings
                      </button>
                    </SettingRow>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        </div>
      </div>
    </div>
  )
}
