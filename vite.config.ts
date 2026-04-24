/// <reference types="node" />

import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { execSync } from 'child_process'

function getBuildLabel() {
  if (process.env.VERCEL_GIT_COMMIT_DATE) {
    return process.env.VERCEL_GIT_COMMIT_DATE
  }

  try {
    return execSync('git log -1 --format=%cI', {
      encoding: 'utf8',
    }).trim()
  } catch {
    return 'local'
  }
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  define: {
    __APP_VERSION__: JSON.stringify(getBuildLabel()),
  },
})
