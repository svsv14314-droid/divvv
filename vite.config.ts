import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    // three.js (~675 kB) is its own chunk, fetched only when a 3D viewport nears the screen.
    chunkSizeWarningLimit: 700,
  },
})
