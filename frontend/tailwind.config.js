// Same design tokens as HRMS_frontEnd: semantic CSS-variable colors that follow the Light/Dark
// toggle, plus one sidebar color per role (Super Admin blue, Owner purple, Tenant cyan).
module.exports = {
  content: ['./public/index.html', './src/**/*.{js,jsx}'],
  darkMode: ['class'],
  theme: {
    extend: {
      colors: {
        primary: { DEFAULT: '#2563eb', foreground: '#ffffff' },
        muted: {
          DEFAULT: 'rgb(var(--color-muted) / <alpha-value>)',
          foreground: 'rgb(var(--color-muted-foreground) / <alpha-value>)',
        },
        accent: { DEFAULT: '#eff6ff', foreground: '#1d4ed8' },
        destructive: { DEFAULT: '#ef4444' },
        border: 'rgb(var(--color-border) / <alpha-value>)',
        card: {
          DEFAULT: 'rgb(var(--color-card) / <alpha-value>)',
          foreground: 'rgb(var(--color-card-foreground) / <alpha-value>)',
        },
        background: 'rgb(var(--color-background) / <alpha-value>)',
        foreground: 'rgb(var(--color-foreground) / <alpha-value>)',
        sidebar: { DEFAULT: '#1e3a8a', muted: 'rgb(255 255 255 / 68%)', accent: 'rgb(255 255 255 / 16%)' },
        owner: { DEFAULT: '#7c3aed', foreground: '#ffffff' },
        'owner-sidebar': { DEFAULT: '#5b21b6', muted: 'rgb(255 255 255 / 68%)', accent: 'rgb(255 255 255 / 16%)' },
        tenant: { DEFAULT: '#06b6d4', foreground: '#ffffff' },
        'tenant-sidebar': { DEFAULT: '#0e7490', muted: 'rgb(255 255 255 / 68%)', accent: 'rgb(255 255 255 / 16%)' },
      },
      borderRadius: { sm: '6px', md: '8px', lg: '10px', xl: '14px', '2xl': '18px' },
      boxShadow: {
        sm: '0 1px 2px rgb(15 23 42 / 0.05)',
        md: '0 4px 16px rgb(15 23 42 / 0.06)',
        lg: '0 12px 32px rgb(15 23 42 / 0.1)',
      },
    },
  },
  plugins: [],
};
