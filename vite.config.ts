import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// base defaults to '/' for local dev; the GitHub Actions workflow overrides
// it to '/<repo-name>/' at build time so assets resolve on GitHub Pages.
export default defineConfig({
  base: process.env.BASE_PATH || '/',
  plugins: [react(), tailwindcss()],
})
