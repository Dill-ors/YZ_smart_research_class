import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/resource/oss': {
        target: 'http://118.190.145.137:8080',
        changeOrigin: true,
      }
    }
  }
})
