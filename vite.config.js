import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// En desarrollo, las peticiones a /api y a /uploads (fotos) se reenvían a la API PHP
// (mismo origen para el navegador: la cookie de sesión funciona sin CORS).
const api = {
  '/api': 'http://127.0.0.1:3001',
  '/uploads': 'http://127.0.0.1:3001',
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: { proxy: api },
  preview: { proxy: api },
})
