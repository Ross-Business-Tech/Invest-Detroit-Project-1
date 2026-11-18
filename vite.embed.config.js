import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// Builds the add-on script (src/embed/main.jsx) as one self-contained file:
// dist/embed/copilot.js. It runs on pages we don't control, so it bundles everything it needs.
export default defineConfig({
  plugins: [react()],
  define: { 'process.env.NODE_ENV': JSON.stringify('production') },
  build: {
    outDir: 'dist/embed',
    emptyOutDir: true,
    copyPublicDir: false,
    lib: {
      entry: 'src/embed/main.jsx',
      name: 'InvestDetroitCopilotBundle',
      formats: ['iife'],
      fileName: () => 'copilot.js',
    },
  },
})
