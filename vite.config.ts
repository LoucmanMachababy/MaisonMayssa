/// <reference types="vitest/config" />
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'

// https://vite.dev/config/
export default defineConfig({
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: './src/test/setup.ts',
    include: ['src/**/*.{test,spec}.{ts,tsx}'],
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: (id) => {
          if (id.includes('node_modules/react/') || id.includes('node_modules/react-dom/')) return 'react'
          if (id.includes('node_modules/framer-motion')) return 'framer'
          if (id.includes('node_modules/lucide-react')) return 'lucide'
        },
      },
    },
    chunkSizeWarningLimit: 600,
  },
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['logo.webp', 'favicon.ico'],
      manifest: {
        name: 'Maison Mayssa',
        short_name: 'Maison Mayssa',
        description: 'Douceurs artisanales à Annecy · Brownies, cookies, tiramisus',
        start_url: '/',
        display: 'standalone',
        background_color: '#fff9f3',
        theme_color: '#5b3a29',
        icons: [
          { src: '/logo.webp', sizes: '192x192', type: 'image/webp', purpose: 'any' },
          { src: '/logo.webp', sizes: '512x512', type: 'image/webp', purpose: 'any maskable' },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,woff2,png,jpg,jpeg,svg,webp}'],
        maximumFileSizeToCacheInBytes: 3 * 1024 * 1024,
        // Precache critical assets for offline access
        navigateFallback: '/index.html',
        navigateFallbackDenylist: [/^\/api/],
        runtimeCaching: [
          // Cache page navigations with network-first strategy
          {
            urlPattern: ({ request }) => request.mode === 'navigate',
            handler: 'NetworkFirst',
            options: {
              cacheName: 'pages',
              networkTimeoutSeconds: 3,
              expiration: { maxEntries: 10, maxAgeSeconds: 24 * 60 * 60 },
            },
          },
          // Cache images with cache-first strategy
          {
            urlPattern: /\.(?:png|jpg|jpeg|svg|gif|webp|avif)$/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'images',
              expiration: { maxEntries: 100, maxAgeSeconds: 30 * 24 * 60 * 60 },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
          // Cache Google Fonts
          {
            urlPattern: /^https:\/\/fonts\.(?:gstatic|googleapis)\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'google-fonts',
              expiration: { maxEntries: 10, maxAgeSeconds: 365 * 24 * 60 * 60 },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
          // Cache JS/CSS chunks with stale-while-revalidate for faster loads
          {
            urlPattern: /\.(?:js|css)$/i,
            handler: 'StaleWhileRevalidate',
            options: {
              cacheName: 'static-resources',
              expiration: { maxEntries: 50, maxAgeSeconds: 7 * 24 * 60 * 60 },
            },
          },
          // Cache external CDN resources
          {
            urlPattern: /^https:\/\/cdn\./i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'cdn-resources',
              expiration: { maxEntries: 20, maxAgeSeconds: 30 * 24 * 60 * 60 },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
        ],
        // Skip waiting to activate new service worker immediately
        skipWaiting: true,
        clientsClaim: true,
      },
    }),
  ],
})
