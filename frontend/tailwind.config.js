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
        primary: {
          50: '#f0f9ff',
          100: '#e0f2fe',
          200: '#bae6fd',
          300: '#7dd3fc',
          400: '#38bdf8',
          500: '#0ea5e9',
          600: '#0284c7',
          700: '#0369a1',
          800: '#075985',
          900: '#0c4a6e',
          950: '#082f49',
        },
        gray: {
          900: '#111827',
          800: '#1F2937',
          700: '#374151',
          600: '#4B5563',
          500: '#6B7280',
          400: '#9CA3AF',
          300: '#D1D5DB',
          200: '#E5E7EB',
          100: '#F3F4F6',
          50: '#F9FAFB',
        },
        brand: {
          50: '#f5f3ff',
          100: '#ede9fe',
          200: '#ddd6fe',
          300: '#c4b5fd',
          400: '#a78bfa',
          500: '#8b5cf6',
          600: '#7c3aed',
          700: '#6d28d9',
          800: '#5b21b6',
          900: '#4c1d95',
        },
        accent: {
          blue: '#3b82f6',
          sky: '#0ea5e9',
          indigo: '#4f46e5',
          purple: '#7c3aed',
          emerald: '#10b981',
        },
        surface: {
          DEFAULT: '#1f2937',
          softer: '#111827',
        },
      },
      boxShadow: {
        'glow-blue': '0 0 15px 4px rgba(59, 130, 246, 0.45)',
        'glow-purple': '0 0 15px 4px rgba(124, 58, 237, 0.45)',
        'glow-brand': '0 0 18px 5px rgba(139, 92, 246, 0.55)',
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(circle at var(--tw-gradient-position, center), var(--tw-gradient-stops))',
        'hero': 'linear-gradient(135deg, #0F172A 0%, #1E3A8A 35%, #3B0764 100%)',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        heading: ['Poppins', 'Inter', 'sans-serif'],
      },
    },
  },
  plugins: [
    require('@tailwindcss/typography'),
  ],
} 