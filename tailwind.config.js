/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./app/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        ivg: {
          // terminal-inspired palette
          dark: "#0b0f14",
          green: "#22c55e",
          neon: "#39ff14",
          cyan: "#22d3ee",
          dim: "#94a3b8",
          border: "rgba(255,255,255,0.10)",
          card: "rgba(255,255,255,0.04)"
        }
      }
    }
  },
  plugins: []
};