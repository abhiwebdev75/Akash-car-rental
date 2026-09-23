/** @type {import('tailwindcss').Config} */
export default {
  // Class-based dark mode: the ThemeProvider toggles `.dark` on <html>.
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      fontFamily: {
        // Archivo carries the headlines (squared, sporty — an automotive voice);
        // Manrope handles UI/body (humanist geometric, highly legible at small sizes).
        display: ['Archivo', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        sans: ['Manrope', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
      colors: {
        // --- Brand anchors (fixed across themes) ---
        // Deep navy: the "night road" anchor, headings and dark surfaces.
        ink: {
          50: '#EEF2F7',
          100: '#D6E0EC',
          200: '#AEC1D6',
          300: '#7B98B5',
          400: '#4A6E93',
          500: '#274F79',
          600: '#1B3E63',
          700: '#14304F',
          800: '#0E2036',
          900: '#0A1524',
          DEFAULT: '#0E2036',
        },
        // Amber signal: the turn-indicator / road-marking colour — primary calls to action.
        signal: {
          50: '#FEF6E6',
          100: '#FCE8BF',
          200: '#FACE70',
          300: '#F7B733',
          400: '#F5A916',
          500: '#F2A007',
          600: '#D98A05',
          700: '#B87104',
          800: '#8F5703',
          DEFAULT: '#F2A007',
        },
        // Teal "go": availability, success, and the route line.
        route: {
          50: '#E6FAF7',
          100: '#C1F1EA',
          200: '#7EE7DC',
          300: '#2CD4C4',
          400: '#12C2B2',
          500: '#0FB5A6',
          600: '#0C9488',
          700: '#0A7268',
          DEFAULT: '#0FB5A6',
        },
        // --- Semantic tokens (flip between light/dark via CSS variables in index.css) ---
        paper: 'rgb(var(--bg) / <alpha-value>)',
        surface: 'rgb(var(--surface) / <alpha-value>)',
        card: 'rgb(var(--card) / <alpha-value>)',
        hair: 'rgb(var(--border) / <alpha-value>)',
        fg: 'rgb(var(--text) / <alpha-value>)',
        'fg-strong': 'rgb(var(--text-strong) / <alpha-value>)',
        muted: 'rgb(var(--muted) / <alpha-value>)',
      },
      borderRadius: {
        // A deliberate scale — hierarchy comes from varied radii, not one size on everything.
        sm: '6px',
        DEFAULT: '10px',
        lg: '14px',
        xl: '20px',
        '2xl': '28px',
      },
      boxShadow: {
        // Navy-tinted, restrained elevation — not the ubiquitous flat grey drop shadow.
        card: '0 1px 2px rgba(14,32,54,0.04), 0 8px 24px -12px rgba(14,32,54,0.14)',
        pop: '0 20px 48px -16px rgba(14,32,54,0.30)',
        signal: '0 10px 26px -10px rgba(242,160,7,0.55)',
      },
      maxWidth: {
        content: '1200px',
      },
      keyframes: {
        'route-draw': {
          '0%': { strokeDashoffset: '240' },
          '100%': { strokeDashoffset: '0' },
        },
        'fade-in': {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        'scale-in': {
          '0%': { opacity: '0', transform: 'translateY(8px) scale(0.98)' },
          '100%': { opacity: '1', transform: 'translateY(0) scale(1)' },
        },
        // Continuous horizontal scroll for the trust-signal marquee. The track is
        // duplicated, so translating by -50% loops seamlessly.
        marquee: {
          '0%': { transform: 'translateX(0)' },
          '100%': { transform: 'translateX(-50%)' },
        },
        // Gentle crossfade + zoom for carousel slides entering view.
        'fade-zoom': {
          '0%': { opacity: '0', transform: 'scale(1.06)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
      },
      animation: {
        'route-draw': 'route-draw 1.1s ease-out forwards',
        'fade-in': 'fade-in 0.2s ease-out',
        'scale-in': 'scale-in 0.2s ease-out',
        marquee: 'marquee 32s linear infinite',
        'fade-zoom': 'fade-zoom 0.9s ease-out',
      },
    },
  },
  plugins: [],
};
