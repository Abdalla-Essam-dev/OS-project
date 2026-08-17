/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        surface: {
          50:'#f8fafc',100:'#f1f5f9',200:'#e2e8f0',300:'#cbd5e1',
          400:'#94a3b8',500:'#64748b',600:'#475569',700:'#334155',
          800:'#1e293b',900:'#0f172a',950:'#020617',
        },
        accent: { 400:'#818cf8',500:'#6366f1',600:'#4f46e5' },
        sync: {
          thinking:'#64748b', hungry:'#eab308', eating:'#22c55e',
          waiting:'#ef4444', idle:'#334155', active:'#6366f1',
          reading:'#3b82f6', writing:'#f97316', done:'#64748b',
        },
      },
    },
  },
  plugins: [],
}
