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
        // Admin uses a subtly cooler, more utilitarian palette than storefront
        bg: {
          DEFAULT: '#F7F7F8',
          elevated: '#FFFFFF',
          muted: '#EEEEF1',
        },
        ink: {
          DEFAULT: '#1A1A1F',
          muted: '#5A5A64',
          subtle: '#9A9AA6',
        },
        accent: {
          DEFAULT: '#B8860B',
          hover: '#9E7409',
        },
        line: '#E4E4E8',
        success: '#2E7D32',
        warning: '#B4820D',
        danger: '#B71C1C',
        info: '#0F5FA3',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'Menlo', 'monospace'],
      },
      spacing: {
        xs: '0.25rem',
        sm: '0.5rem',
        md: '1rem',
        lg: '1.5rem',
        xl: '2rem',
        '2xl': '3rem',
      },
    },
  },
  plugins: [],
};
