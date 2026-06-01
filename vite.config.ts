import { defineConfig } from 'vite'
import { crx } from '@crxjs/vite-plugin'
import { resolve } from 'path'
import fs from 'fs'

const browser = (process.env.BROWSER ?? 'chrome') as 'chrome' | 'firefox'
const isFirefox = browser === 'firefox'

const manifestPath = resolve(
  __dirname,
  isFirefox ? 'src/manifest.firefox.json' : 'src/manifest.chrome.json',
)
const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf-8'))

export default defineConfig({
  plugins: [crx({ manifest })],
  resolve: {
    alias: {
      '@': resolve(__dirname, './src'),
      '@shared': resolve(__dirname, './src/shared'),
    },
  },
  build: {
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
      },
    },
    outDir: isFirefox ? 'dist/firefox' : 'dist/chrome',
    emptyOutDir: true,
    chunkSizeWarningLimit: 1000,
  },
})
