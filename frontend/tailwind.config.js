module.exports = {
  content: ['./public/index.html', './src/**/*.{js,jsx}'],
  darkMode: ['class'],
  theme: {
    extend: {
      colors: {
        primary: { DEFAULT: '#365f88', foreground: '#ffffff' },
        muted: {
          DEFAULT: 'rgb(var(--color-muted) / <alpha-value>)',
          foreground: 'rgb(var(--color-muted-foreground) / <alpha-value>)',
        },
        accent: { DEFAULT: '#edf2f7', foreground: '#365f88' },
        destructive: { DEFAULT: '#ef4444' },
        border: 'rgb(var(--color-border) / <alpha-value>)',
        card: {
          DEFAULT: 'rgb(var(--color-card) / <alpha-value>)',
          foreground: 'rgb(var(--color-card-foreground) / <alpha-value>)',
        },
        background: 'rgb(var(--color-background) / <alpha-value>)',
        foreground: 'rgb(var(--color-foreground) / <alpha-value>)',
        sidebar: { DEFAULT: '#23364d', muted: 'rgb(255 255 255 / 68%)', accent: 'rgb(255 255 255 / 12%)' },
        owner: { DEFAULT: '#765d91', foreground: '#ffffff' },
        'owner-sidebar': { DEFAULT: '#463956', muted: 'rgb(255 255 255 / 68%)', accent: 'rgb(255 255 255 / 12%)' },
        tenant: { DEFAULT: '#3e8090', foreground: '#ffffff' },
        'tenant-sidebar': { DEFAULT: '#294e59', muted: 'rgb(255 255 255 / 68%)', accent: 'rgb(255 255 255 / 12%)' },
      },
      borderRadius: { sm: '6px', md: '8px', lg: '10px', xl: '14px', '2xl': '18px' },
      boxShadow: {
        sm: '0 1px 2px rgb(25 36 52 / 0.04)',
        md: '0 5px 18px rgb(25 36 52 / 0.07)',
        lg: '0 14px 36px rgb(25 36 52 / 0.11)',
      },
    },
  },
  plugins: [],
};
