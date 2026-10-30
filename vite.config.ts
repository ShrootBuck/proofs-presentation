import { defineConfig } from 'vite'
export default defineConfig({
  server: {
    proxy: {
      '/api': 'http://localhost:3040',
      '/host': 'http://localhost:3040',
      '/join': 'http://localhost:3040',
      '/voting': 'http://localhost:3040',
      '/vendor': 'http://localhost:3040',
    },
  },
})
