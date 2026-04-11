/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: '#2F3E46',
        accent: '#F4A261',
        bgLight: '#F5F7FA',
        textPrimary: '#1F2937',
        textSecondary: '#6B7280',
        borderColor: '#E5E7EB',
        hoverGray: '#F3F4F6',
      },
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', '-apple-system', 'sans-serif'],
      },
    },
  },
  plugins: [],
}

