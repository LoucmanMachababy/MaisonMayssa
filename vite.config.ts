import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
// PWA désactivé temporairement — cause fréquente de page blanche/lente sur mobile (service worker)
// import { VitePWA } from 'vite-plugin-pwa'

// https://vite.dev/config/
export default defineConfig({
  build: {
    rollupOptions: {
      output: {
        manualChunks: (id) => {
          if (id.includes('node_modules/react/') || id.includes('node_modules/react-dom/')) return 'react'
          if (id.includes('node_modules/framer-motion')) return 'framer'
          if (id.includes('node_modules/lucide-react')) return 'lucide'
          if (id.includes('node_modules/firebase')) return 'firebase'
        },
      },
    },
    chunkSizeWarningLimit: 600,
  },
  plugins: [
    react(),
    tailwindcss(),
  ],
})
