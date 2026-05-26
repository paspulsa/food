import { defineConfig } from 'vite'
import honox from 'honox/vite'
import pages from '@hono/vite-cloudflare-pages'

export default defineConfig({
  plugins: [
    honox({
      // HonoX hanya akan fokus membaca folder app/
      entry: './app/server.ts', 
    }),
    pages()
  ]
})
