import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
  ],
  build: {
    rollupOptions: {
      input: { main: "index.html", bookings: "bookings.html", admin: "admin.html" },
    },
  },
  base: "/anna-rafa-pt/", // <-- Make sure this matches your exact GitHub repo name!
})