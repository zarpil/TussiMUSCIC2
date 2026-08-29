/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        aurora: {
          purple: '#0f0c29',
          blue: '#302b63',
          teal: '#24243e',
        },
        tussi: {
          pink: '#ff2d87',
          hotpink: '#ff1493',
          magenta: '#e01e84',
          dark: '#0e0714',
          card: '#160b20',
          border: '#331238'
        }
      },
      backdropBlur: {
        xs: '2px',
      }
    },
  },
  plugins: [],
}
