import { defineConfig } from 'vite'
export default defineConfig({
  // This deck has no Twoslash code annotations. Its adapter reaches into an
  // obsolete FloatingVue component shape and throws at every desktop startup.
  // Install the supported tooltip plugin directly for Slidev's own controls.
  resolve: {
    alias: [{ find: '@shikijs/vitepress-twoslash/client', replacement: 'floating-vue' }],
  },
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
