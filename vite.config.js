import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  base: '/smart_research/',
  plugins: [react()],
  server: {
    host: '0.0.0.0', 
    proxy: {
      // '/resource/oss': {
      //   target: 'http://118.190.145.137:8080',
      //   changeOrigin: true,
      // },
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true,
      }
    }
  }
})
