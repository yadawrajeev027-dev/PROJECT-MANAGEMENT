/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // Minimalist SaaS reference palette
        sidebar: {
          bg: '#080808',
          card: '#141414',
          active: '#1c1c1c',
          border: '#222222',
          text: '#ffffff',
          muted: '#888888',
        },
        surface: {
          bg: '#F7F7F5',
          card: '#FFFFFF',
          border: '#EAEAEA',
          borderDark: '#D8D8D8',
          hover: '#F2F2F0',
        },
        ink: {
          primary: '#171717',
          secondary: '#777777',
          muted: '#999999',
          border: '#EAEAEA',
        },
        accent: {
          yellow: '#F5C400',
          'yellow-light': '#FEF8E3',
          'yellow-hover': '#E0B300',
          orange: '#F28C28',
          'orange-light': '#FDF4EB',
        },
        // Fallback mappings to guarantee legacy classes seamlessly adapt to the new palette
        navy: {
          950: '#080808', // Deep black
          900: '#F7F7F5', // Soft off-white main background
          850: '#FFFFFF', // Pure white card
          800: '#FFFFFF', // Elevated card / neutral
          750: '#EAEAEA', // Light gray divider
          700: '#E5E5E5',
          600: '#777777',
        },
        brand: {
          purple: '#F5C400', // Warm yellow primary accent
          'purple-light': '#FEF8E3',
          'purple-dark': '#E0B300',
          blue: '#F28C28', // Soft orange secondary accent
          'blue-light': '#FDF4EB',
          'blue-dark': '#D97316',
          cyan: '#F5C400',
        }
      },
      fontFamily: {
        sans: ['Inter', '"Plus Jakarta Sans"', '-apple-system', 'BlinkMacSystemFont', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'monospace'],
      },
      boxShadow: {
        'subtle': '0 1px 3px 0 rgba(0, 0, 0, 0.04), 0 1px 2px -1px rgba(0, 0, 0, 0.04)',
        'card': '0 1px 3px 0 rgba(0, 0, 0, 0.05), 0 1px 2px 0 rgba(0, 0, 0, 0.03)',
        'card-hover': '0 4px 12px 0 rgba(0, 0, 0, 0.06)',
        'yellow-sm': '0 2px 8px -1px rgba(245, 196, 0, 0.35)',
        'card-glow': '0 2px 8px -2px rgba(0, 0, 0, 0.06)',
        'purple-glow': '0 2px 8px -1px rgba(245, 196, 0, 0.35)',
        'blue-glow': '0 2px 8px -1px rgba(242, 140, 40, 0.35)',
      }
    },
  },
  plugins: [],
}
