import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}'
  ],
  theme: {
    extend: {
      colors: {
        ocean: {
          50: '#f2f7ff',
          100: '#e3edff',
          200: '#c0d8ff',
          300: '#91baff',
          400: '#5e94ff',
          500: '#3a6ff0',
          600: '#2a56d9',
          700: '#2345ad',
          800: '#213a8a',
          900: '#1f336f'
        }
      }
    }
  },
  plugins: []
};

export default config;
