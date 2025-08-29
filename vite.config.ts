import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import { viteSingleFile } from 'vite-plugin-singlefile'
import svgLoader from 'vite-svg-loader'

// https://vitejs.dev/config/
export default defineConfig({
  build: {
    assetsInlineLimit: 100000000,
    cssCodeSplit: false,
    chunkSizeWarningLimit: 100000000,
    outDir: 'dist',
    reportCompressedSize: false,
    rollupOptions: {
      output: {
        inlineDynamicImports: true,
      },
    },
    target: 'esnext',
  },
  plugins: [react(), viteSingleFile(), svgLoader()],
  worker: {
    format: 'es',
    plugins: []
  }
})
