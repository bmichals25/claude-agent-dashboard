'use client'

import { motion } from 'motion/react'
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

function SettingSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div
      style={{
        marginBottom: '32px',
      }}
    >
      <h3
        style={{
          fontSize: '11px',
          fontWeight: 600,
          textTransform: 'uppercase',
          letterSpacing: '0.1em',
          color: 'var(--text-muted)',
          marginBottom: '16px',
        }}
      >
        {title}
      </h3>
      <div
        style={{
          background: 'var(--bg-elevated)',
          border: '1px solid var(--glass-border)',
          borderRadius: '16px',
          overflow: 'hidden',
        }}
      >
        {children}
      </div>
    </div>
  )
}

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
        padding: '16px 20px',
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
    <div className="h-full overflow-y-auto scrollbar-fade">
      <div style={{ maxWidth: '720px', margin: '0 auto', padding: '48px 56px 120px' }}>
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

      {/* Branding Section */}
      <SettingSection title="Branding">
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
      </SettingSection>

      {/* Appearance Section */}
      <SettingSection title="Appearance">
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
      </SettingSection>

      {/* Notifications Section */}
      <SettingSection title="Notifications">
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
        {settings.soundEnabled && (
          <SettingRow label="Volume" description="Adjust sound effect volume" isLast>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <input
                type="range"
                min="0"
                max="1"
                step="0.1"
                value={settings.soundVolume}
                onChange={(e) => handleVolumeChange(parseFloat(e.target.value))}
                style={{
                  width: '100px',
                  accentColor: settings.accentColor,
                  cursor: 'pointer',
                }}
              />
              <span
                style={{
                  fontSize: '12px',
                  fontFamily: 'ui-monospace, monospace',
                  color: 'var(--text-secondary)',
                  minWidth: '36px',
                }}
              >
                {Math.round(settings.soundVolume * 100)}%
              </span>
            </div>
          </SettingRow>
        )}
        {!settings.soundEnabled && (
          <div style={{ height: '1px' }} />
        )}
      </SettingSection>

      {/* Chat Section */}
      <SettingSection title="Chat">
        <SettingRow label="Auto-scroll" description="Automatically scroll to new messages" isLast>
          <Toggle
            enabled={settings.autoScrollChat}
            onChange={(enabled) => updateSettings({ autoScrollChat: enabled })}
            color={settings.accentColor}
            onToggle={playToggle}
          />
        </SettingRow>
      </SettingSection>

      {/* Danger Zone */}
      <SettingSection title="Danger Zone">
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
            Reset
          </button>
        </SettingRow>
      </SettingSection>

        {/* Version info */}
        <div
          className="text-center py-6 mt-4 text-[11px] font-mono"
          style={{ color: 'var(--text-muted)' }}
        >
          Claude Agent Dashboard v1.0.0
        </div>
      </div>
    </div>
  )
}
