import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { resolve } from 'path'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@letsbelopez/react-cognito': resolve(__dirname, '../../packages/react-cognito/src/index.ts'),
      '@letsbelopez/cognito-core': resolve(__dirname, '../../packages/cognito-core/src/index.ts')
    }
  },
  optimizeDeps: {
    include: ['@letsbelopez/react-cognito', '@letsbelopez/cognito-core']
  },
  build: {
    commonjsOptions: {
      include: [/@letsbelopez\/.*/, /node_modules\/.*/],
    }
  }
})
