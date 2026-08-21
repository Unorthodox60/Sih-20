import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    host: true, // Listen on all local IPs (makes it accessible to other laptops on the network)
    port: 5173,
    strictPort: true,
  },
  build: {
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true, // Optimize by removing console logs in production
        drop_debugger: true,
      },
    },
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom', 'lucide-react'], // Splitting vendor chunks for optimization
        },
      },
    },
  }
})
