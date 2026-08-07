export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        carbon: { DEFAULT: '#0A0A0A', surface: '#161616', raised: '#1F1F1F' },
        steel: { DEFAULT: '#3D3D3D', light: '#5C5C5C' },
        blood: { DEFAULT: '#DC2626', glow: '#EF4444' },
        forge: { DEFAULT: '#C9A646', dim: '#8A7330', glow: '#E8C76A' },
        amberwarn: { DEFAULT: '#D97706', glow: '#F59E0B' },
        bone: { DEFAULT: '#E8E8E8', dim: '#A3A3A3' },
        flex: { DEFAULT: '#6366F1', glow: '#818CF8', dim: '#4F46E5' },
      },
      fontFamily: {
        display: ['"Oswald"', 'sans-serif'],
        body: ['"Inter"', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
