import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // Renkleri isimlendirerek bir palet oluşturuyoruz.
        'background': '#000010', // Statik mor yerine, çok koyu, hafif maviye çalan bir uzay boşluğu rengi.
        'primary': '#9D00FF', // Neon Mor (Ana Vurgu)
        'secondary': '#00F0FF', // Siber Mavi (İkincil Vurgu)
        'accent': '#FFFFFF', // Saf Beyaz (Metinler ve Vurgular)
        'muted': '#A0A0A0', // Daha az önemli, soluk metinler için.
      },
      // Projeye özel animasyonlar tanımlıyoruz.
      animation: {
        'gradient-bg': 'gradient-bg 15s ease infinite', // Arka plan için yavaş gradient animasyonu.
        'glow': 'glow 2s ease-in-out infinite alternate', // Butonlar ve kartlar için nabız gibi atan parlama efekti.
      },
      // Animasyonların kendisini (keyframes) tanımlıyoruz.
      keyframes: {
        'gradient-bg': {
          '0%, 100%': { backgroundPosition: '0% 50%' },
          '50%': { backgroundPosition: '100% 50%' },
        },
        'glow': {
          'from': { boxShadow: '0 0 10px #9D00FF, 0 0 20px #9D00FF' },
          'to': { boxShadow: '0 0 20px #9D00FF, 0 0 30px #9D00FF' },
        },
      },
      // Glassmorphism için özel bir arkaplan blur efekti
      backdropBlur: {
        'xl': '24px',
      }
    },
  },
  plugins: [],
}
export default config

