import fs from 'fs'
import path from 'path'

const manifestPath = path.resolve('dist/manifest.json')

if (fs.existsSync(manifestPath)) {
  const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf-8'))

  // Add the scripts block for Firefox support alongside Chrome's service_worker
  if (manifest.background) {
    manifest.background.scripts = ['service-worker-loader.js']
    console.log('Successfully injected background.scripts into dist/manifest.json for Firefox compatibility!')
  }

  fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2), 'utf-8')
} else {
  console.error('Error: dist/manifest.json not found!')
}
