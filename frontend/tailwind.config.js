// "Ember" theme: semantic CSS-variable colors that follow the Light/Dark toggle, a warm Claude-orange
// primary with a pastel support palette, one accent per role (Super Admin plum, Owner ember,
// Tenant mist), and iOS-style easing + motion presets.
const v = (name) => `rgb(var(--color-${name}) / <alpha-value>)`;

module.exports = {
  content: ['./public/index.html', './src/**/*.{js,jsx}'],
  darkMode: ['class'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['"Product Sans"', '"Google Sans"', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
        display: ['"Product Sans"', '"Google Sans"', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
      },
      colors: {
        primary: { DEFAULT: v('primary'), foreground: '#ffffff' },
        brand: { violet: v('brand-violet'), pink: v('brand-pink') },
        muted: { DEFAULT: v('muted'), foreground: v('muted-foreground') },
        accent: { DEFAULT: v('accent'), foreground: v('primary') },
        destructive: { DEFAULT: '#ef4444' },
        border: v('border'),
        card: { DEFAULT: v('card'), foreground: v('card-foreground') },
        background: v('background'),
        foreground: v('foreground'),
        ember: { 50: '#FDF3EE', 100: '#FAE3D8', 200: '#F4C4AE', 300: '#EDA184', 400: '#E5896B', 500: '#D97757', 600: '#C15F40', 700: '#9E4A31', 800: '#7A3926', 900: '#4F2519' },
        coral: { 50: '#FEF1EF', 100: '#FDDDD8', 200: '#FABAB1', 300: '#F49184', 400: '#EE7666', 500: '#E85D4F', 600: '#CF4436', 700: '#A9352A', 800: '#7F2920', 900: '#521B15' },
        plum: { 50: '#F8EFF6', 100: '#EEDBEA', 200: '#DDB5D5', 300: '#C589BA', 400: '#A5609A', 500: '#87457D', 600: '#6E3468', 700: '#5A2A55', 800: '#3F1D3C', 900: '#2A1328' },
        mist: { 50: '#EFF8FD', 100: '#DCEFFA', 200: '#B9DFF4', 300: '#93CDEE', 400: '#7DC4EB', 500: '#4FA9DB', 600: '#2F8CBD', 700: '#246F97', 800: '#1C5574', 900: '#133A50' },
        sage: { 50: '#F0F8F1', 100: '#DCEFDF', 200: '#BCE0C1', 300: '#9DD0A4', 400: '#8FC996', 500: '#5FAE6B', 600: '#3F915C', 700: '#317349', 800: '#255737', 900: '#183A25' },
        butter: { 100: '#FDF1D6', 200: '#FBE3AE', 300: '#F8D58A', 400: '#F4C462', 500: '#E9AE3A', 700: '#9A6B12' },
        sidebar: { DEFAULT: '#2A1328', muted: 'rgb(255 255 255 / 64%)', accent: 'rgb(255 255 255 / 14%)' },
        owner: { DEFAULT: '#D97757', foreground: '#ffffff' },
        'owner-sidebar': { DEFAULT: '#2B1710', muted: 'rgb(255 255 255 / 64%)', accent: 'rgb(255 255 255 / 14%)' },
        tenant: { DEFAULT: '#2F8CBD', foreground: '#ffffff' },
        'tenant-sidebar': { DEFAULT: '#0F2A3A', muted: 'rgb(255 255 255 / 64%)', accent: 'rgb(255 255 255 / 14%)' },
      },
      borderRadius: { sm: '8px', md: '10px', lg: '12px', xl: '16px', '2xl': '22px', '3xl': '28px' },
      boxShadow: {
        sm: '0 1px 2px rgb(60 36 24 / 0.04), 0 1px 3px rgb(60 36 24 / 0.04)',
        md: '0 2px 4px rgb(60 36 24 / 0.03), 0 8px 24px -4px rgb(60 36 24 / 0.08)',
        lg: '0 4px 8px rgb(60 36 24 / 0.04), 0 20px 48px -8px rgb(60 36 24 / 0.16)',
        xl: '0 8px 16px rgb(60 36 24 / 0.05), 0 32px 64px -12px rgb(60 36 24 / 0.22)',
        glow: '0 1px 2px rgb(60 36 24 / 0.06), 0 2px 6px rgb(60 36 24 / 0.08)',
        'glow-lg': '0 2px 4px rgb(60 36 24 / 0.05), 0 8px 20px -4px rgb(60 36 24 / 0.12)',
      },
      transitionTimingFunction: {
        ios: 'cubic-bezier(0.32, 0.72, 0, 1)',
        spring: 'cubic-bezier(0.34, 1.4, 0.64, 1)',
      },
      transitionDuration: { 250: '250ms', 400: '400ms', 600: '600ms' },
      keyframes: {
        'page-push': {
          from: { opacity: '0', transform: 'translate3d(28px, 0, 0)' },
          to: { opacity: '1', transform: 'none' },
        },
        'page-pop': {
          from: { opacity: '0', transform: 'translate3d(-28px, 0, 0)' },
          to: { opacity: '1', transform: 'none' },
        },
        'fade-up': {
          from: { opacity: '0', transform: 'translate3d(0, 12px, 0)' },
          to: { opacity: '1', transform: 'none' },
        },
        'fade-in': { from: { opacity: '0' }, to: { opacity: '1' } },
        'toast-in': {
          from: { opacity: '0', transform: 'translate3d(0, -24px, 0) scale(0.9)' },
          to: { opacity: '1', transform: 'none' },
        },
        'toast-out': {
          from: { opacity: '1', transform: 'none' },
          to: { opacity: '0', transform: 'translate3d(0, -16px, 0) scale(0.92)' },
        },
        blob: {
          '0%, 100%': { transform: 'translate3d(0, 0, 0) scale(1)' },
          '33%': { transform: 'translate3d(30px, -40px, 0) scale(1.08)' },
          '66%': { transform: 'translate3d(-24px, 20px, 0) scale(0.94)' },
        },
        float: {
          '0%, 100%': { transform: 'translate3d(0, 0, 0)' },
          '50%': { transform: 'translate3d(0, -10px, 0)' },
        },
        shimmer: { from: { backgroundPosition: '200% 0' }, to: { backgroundPosition: '-200% 0' } },
      },
      animation: {
        'page-push': 'page-push 480ms cubic-bezier(0.32, 0.72, 0, 1) both',
        'page-pop': 'page-pop 480ms cubic-bezier(0.32, 0.72, 0, 1) both',
        'fade-up': 'fade-up 520ms cubic-bezier(0.32, 0.72, 0, 1) both',
        'fade-in': 'fade-in 400ms ease-out both',
        'toast-in': 'toast-in 520ms cubic-bezier(0.34, 1.4, 0.64, 1) both',
        'toast-out': 'toast-out 320ms cubic-bezier(0.32, 0.72, 0, 1) both',
        blob: 'blob 18s ease-in-out infinite',
        float: 'float 6s ease-in-out infinite',
        shimmer: 'shimmer 6s linear infinite',
      },
    },
  },
  plugins: [],
};
