import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './app/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './hooks/**/*.{ts,tsx}',
    './lib/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {
      // garante que line-clamp funcione no Safari mais antigo
      lineClamp: { 1: '1', 2: '2', 3: '3' },
    },
  },
  plugins: [],
}

export default config
