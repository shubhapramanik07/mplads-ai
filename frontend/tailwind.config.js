/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        gov: {
          navy: '#0A2540',
          blue: '#1A56DB',
          lightBlue: '#EBF5FF',
          gold: '#D97706',
          saffron: '#FF671F',
          green: '#046A38',
          ashoka: '#000080',
          border: '#E2E8F0',
          bg: '#F8FAFC'
        },
        risk: {
          high: '#DC2626',
          highBg: '#FEE2E2',
          highText: '#991B1B',
          med: '#D97706',
          medBg: '#FEF3C7',
          medText: '#92400E',
          low: '#16A34A',
          lowBg: '#DCFCE7',
          lowText: '#166534'
        }
      },
      boxShadow: {
        'gov': '0 1px 3px 0 rgba(0, 0, 0, 0.08), 0 1px 2px 0 rgba(0, 0, 0, 0.04)',
        'gov-lg': '0 10px 15px -3px rgba(0, 0, 0, 0.08), 0 4px 6px -2px rgba(0, 0, 0, 0.03)',
      }
    },
  },
  plugins: [],
}
