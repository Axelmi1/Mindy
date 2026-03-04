/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,jsx,ts,tsx}",
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        // GitHub Dark palette
        background: '#0D1117',
        surface: '#161B22',
        'surface-hover': '#21262D',
        border: '#30363D',
        
        // Accent colors
        primary: '#39FF14',       // Neon Green
        secondary: '#58A6FF',     // Electric Blue
        warning: '#F78166',       // Streak fire
        
        // Text
        text: '#E6EDF3',
        'text-muted': '#8B949E',
        'text-dim': '#484F58',
        
        // Feedback
        success: '#39FF14',
        error: '#F85149',
      },
      fontFamily: {
        mono: ['JetBrainsMono', 'monospace'],
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      borderRadius: {
        'card': '12px',
      },
      boxShadow: {
        'neon': '0 0 20px rgba(57, 255, 20, 0.3)',
        'neon-strong': '0 0 30px rgba(57, 255, 20, 0.5)',
      },
    },
  },
  plugins: [],
};

