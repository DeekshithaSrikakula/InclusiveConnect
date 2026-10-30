/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        sap: {
          navy: '#002A54',
          blue: '#0070F2',
          gold: '#F0AB00',
          slate: '#F5F7FA'
        }
      }
    }
  },
  plugins: []
};
