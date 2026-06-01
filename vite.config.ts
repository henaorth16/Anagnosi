import { defineConfig } from 'vite'
import { crx } from '@crxjs/vite-plugin'
import { resolve } from 'path'
import fs from 'fs'

const buildTarget = process.env.BUILD_TARGET ?? 'extension'
const isWebBuild = buildTarget === 'web'
const browser = (process.env.BROWSER ?? 'chrome') as 'chrome' | 'firefox'
const isFirefox = browser === 'firefox'

const manifestPath = resolve(
  __dirname,
  isFirefox ? 'src/manifest.firefox.json' : 'src/manifest.chrome.json',
)
const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf-8'))

export default defineConfig({
  // Root-relative paths so assets resolve on Vercel (and any static host).
  base: '/',
  plugins: isWebBuild ? [] : [crx({ manifest })],
  resolve: {
    alias: {
      '@': resolve(__dirname, './src'),
      '@shared': resolve(__dirname, './src/shared'),
    },
  },
  build: {
    // Web: standard Vite SPA → dist/ (deployed to Vercel).
    // Extension: CRX bundles → dist/chrome or dist/firefox.
    outDir: isWebBuild ? 'dist' : isFirefox ? 'dist/firefox' : 'dist/chrome',
    emptyOutDir: true,
    chunkSizeWarningLimit: 1000,
    rollupOptions: isWebBuild
      ? undefined
      : {
          input: {
            main: resolve(__dirname, 'index.html'),
          },
        },
  },
})
