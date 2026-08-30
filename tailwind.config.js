/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#eff6ff',  // Biru sangat muda (untuk background hover ringan)
          100: '#dbeafe',
          500: '#3b82f6', // Biru Utama (Primary)
          600: '#2563eb', // Biru tombol hover
          800: '#1e40af', // Biru gelap (untuk hover sidebar)
          900: '#1e3a8a', // Biru sangat gelap (untuk background Sidebar)
        }
      }
    },
  },
  plugins: [],
}