/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        green: {
          50:  '#f2f8f4',
          100: '#e0f0e5',
          200: '#c0e0cc',
          300: '#a8c5a0',
          400: '#7aaa85',
          500: '#3d7a4f',
          600: '#2e6040',
          700: '#234d33',
          800: '#1a3a26',
          900: '#122819',
        },
        soil: {
          100: '#f6f6f7',
          200: '#ebebec',
          300: '#d4d4d6',
          400: '#a8a8ac',
          500: '#77777d',
        },
        amber: {
          300: '#f5d87a',
          400: '#e8c547',
          500: '#c9a832',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      borderRadius: {
        '4xl': '2rem',
      },
      boxShadow: {
        'card':       '0 2px 16px 0 rgba(61,122,79,0.08), 0 1px 4px 0 rgba(0,0,0,0.04)',
        'card-hover': '0 8px 32px 0 rgba(61,122,79,0.14), 0 2px 8px 0 rgba(0,0,0,0.06)',
        'modal':      '0 24px 64px 0 rgba(0,0,0,0.18)',
      },
    },
  },
  plugins: [],
}

