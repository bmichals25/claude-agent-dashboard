import type { Config } from 'tailwindcss'

export default {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        'bg': '#030708',
        'glass': 'rgba(255, 255, 255, 0.03)',
        'accent': '#00fff0',
        'accent-pink': '#ff00c1',
        'accent-purple': '#7000ff',
      },
      fontFamily: {
        sans: ['Plus Jakarta Sans', 'sans-serif'],
        mono: ['Space Mono', 'monospace'],
      },
      animation: {
        'morph': 'morph 6s ease-in-out infinite',
        'pulse-glow': 'pulse-glow 2s ease-in-out infinite',
        'float': 'float 3s ease-in-out infinite',
        'blink': 'blink 4s infinite',
      },
      keyframes: {
        morph: {
          '0%': { borderRadius: '40% 60% 70% 30% / 40% 50% 60% 50%' },
          '33%': { borderRadius: '70% 30% 50% 50% / 30% 30% 70% 70%' },
          '66%': { borderRadius: '30% 60% 70% 40% / 50% 60% 30% 60%' },
          '100%': { borderRadius: '40% 60% 70% 30% / 40% 50% 60% 50%' },
        },
        'pulse-glow': {
          '0%, 100%': { opacity: '0.4' },
          '50%': { opacity: '1' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-10px)' },
        },
        blink: {
          '0%, 90%, 100%': { transform: 'scaleY(1)' },
          '95%': { transform: 'scaleY(0.1)' },
        },
      },
    },
  },
  plugins: [],
} satisfies Config
