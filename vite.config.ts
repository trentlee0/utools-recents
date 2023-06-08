import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import utools from 'vite-plugin-utools'
import { resolve } from 'path'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    vue(),
    utools({
      external: 'utools-api',
      preload: {
        path: './src/preload.ts',
        watch: true,
        name: 'window.preload'
      },
      buildUpx: false
    })
  ],
  resolve: {
    alias: [
      {
        find: '@',
        replacement: resolve(__dirname, './src')
      }
    ]
  }
})
