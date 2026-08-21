const { createGlobPatternsForDependencies } = require('@nx/angular/tailwind');
const { join } = require('path');

/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    join(__dirname, 'src/**/!(*.stories|*.spec).{ts,html,scss}'),
    ...createGlobPatternsForDependencies(__dirname),
  ],
  theme: {
    extend: {
      colors: {
        bg: {
          DEFAULT: '#FAF6EF',
          elevated: '#FFFFFF',
          muted: '#F1EADD',
        },
        ink: {
          DEFAULT: '#1F1B16',
          muted: '#6B6355',
          subtle: '#A69C88',
        },
        gold: {
          DEFAULT: '#B8860B',
          hover: '#9E7409',
          soft: '#D4AF37',
        },
        line: '#E7DFCE',
        success: '#2E7D32',
        warning: '#B4820D',
        danger: '#B71C1C',
        info: '#0F5FA3',
      },
      fontFamily: {
        serif: ['"Playfair Display"', 'Georgia', 'serif'],
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'Menlo', 'monospace'],
      },
      fontSize: {
        'display': ['3.5rem', { lineHeight: '4rem', fontWeight: '600' }],
        'h1': ['2.5rem', { lineHeight: '3rem', fontWeight: '600' }],
        'h2': ['2rem', { lineHeight: '2.5rem', fontWeight: '600' }],
        'h3': ['1.5rem', { lineHeight: '2rem', fontWeight: '600' }],
        'h4': ['1.25rem', { lineHeight: '1.75rem', fontWeight: '500' }],
        'body-lg': ['1.125rem', { lineHeight: '1.75rem' }],
        'body': ['1rem', { lineHeight: '1.5rem' }],
        'body-sm': ['0.875rem', { lineHeight: '1.25rem' }],
        'caption': ['0.75rem', { lineHeight: '1rem', letterSpacing: '0.05em', fontWeight: '500' }],
        'price': ['1.25rem', { lineHeight: '1.5rem', fontWeight: '600' }],
      },
      spacing: {
        xs: '0.25rem',
        sm: '0.5rem',
        md: '1rem',
        lg: '1.5rem',
        xl: '2rem',
        '2xl': '3rem',
        '3xl': '4rem',
        '4xl': '6rem',
      },
      maxWidth: {
        container: '1280px',
      },
      screens: {
        sm: '640px',
        md: '768px',
        lg: '1024px',
        xl: '1280px',
        '2xl': '1536px',
      },
    },
  },
  plugins: [],
};
