import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    watch: {
      usePolling: true, // fallback to polling
      interval: 1000, // check every second
      ignored: [
        
      ]
    }
  }
})
