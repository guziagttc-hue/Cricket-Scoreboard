import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { defineConfig } from 'vite';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig(() => {
  return {
    plugins: [
      react(),
      tailwindcss(),
      VitePWA({
        registerType: 'autoUpdate',
        includeAssets: ['favicon.ico', 'apple-touch-icon.png', 'mask-icon.svg'],
        manifest: {
          name: 'ক্রিকেট স্কোরবোর্ড',
          short_name: 'স্কোরবোর্ড',
          description: 'এমবি ছাড়াই ব্যবহার করুন ক্রিকেট স্কোরবোর্ড অ্যাপ',
          theme_color: '#020617',
          background_color: '#020617',
          display: 'standalone',
          icons: [
            {
              src: 'https://res.cloudinary.com/dlklqihg6/image/upload/v1760308052/kkchmpjdp9izcjfvvo4k.jpg',
              sizes: '192x192',
              type: 'image/jpeg'
            },
            {
              src: 'https://res.cloudinary.com/dlklqihg6/image/upload/v1760308052/kkchmpjdp9izcjfvvo4k.jpg',
              sizes: '512x512',
              type: 'image/jpeg'
            },
            {
              src: 'https://res.cloudinary.com/dlklqihg6/image/upload/v1760308052/kkchmpjdp9izcjfvvo4k.jpg',
              sizes: '192x192',
              type: 'image/jpeg',
              purpose: 'any maskable'
            }
          ]
        }
      })
    ],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modifyâfile watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
      // Disable file watching when DISABLE_HMR is true to save CPU during agent edits.
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});
