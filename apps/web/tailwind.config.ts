import type { Config } from 'tailwindcss';

const config: Config = {
  darkMode: ['class'],
  content: [
    './src/**/*.{ts,tsx}',
    '../../packages/ui/src/**/*.{ts,tsx}',
  ],
  theme: {
    container: {
      center: true,
      padding: '2rem',
      screens: {
        '2xl': '1400px',
      },
    },
    extend: {
      colors: {
        border: 'hsl(var(--border))',
        input: 'hsl(var(--input))',
        ring: 'hsl(var(--ring))',
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        primary: {
          DEFAULT: 'hsl(var(--primary))',
          foreground: 'hsl(var(--primary-foreground))',
        },
        secondary: {
          DEFAULT: 'hsl(var(--secondary))',
          foreground: 'hsl(var(--secondary-foreground))',
        },
        destructive: {
          DEFAULT: 'hsl(var(--destructive))',
          foreground: 'hsl(var(--destructive-foreground))',
        },
        muted: {
          DEFAULT: 'hsl(var(--muted))',
          foreground: 'hsl(var(--muted-foreground))',
        },
        accent: {
          DEFAULT: 'hsl(var(--accent))',
          foreground: 'hsl(var(--accent-foreground))',
        },
        popover: {
          DEFAULT: 'hsl(var(--popover))',
          foreground: 'hsl(var(--popover-foreground))',
        },
        card: {
          DEFAULT: 'hsl(var(--card))',
          foreground: 'hsl(var(--card-foreground))',
        },
        ccd: {
          blue: 'hsl(var(--ccd-blue))',
          lime: 'hsl(var(--ccd-lime))',
          cream: 'hsl(var(--ccd-cream))',
          dark: 'hsl(var(--ccd-dark))',
        },
        module: {
          crm: 'hsl(var(--module-crm))',
          analytics: 'hsl(var(--module-analytics))',
          content: 'hsl(var(--module-content))',
          seo: 'hsl(var(--module-seo))',
          social: 'hsl(var(--module-social))',
          portal: 'hsl(var(--module-portal))',
          projects: 'hsl(var(--module-projects))',
          finance: 'hsl(var(--module-finance))',
          hr: 'hsl(var(--module-hr))',
        },
      },
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
        heading: ['Jeko', 'Inter', 'system-ui', '-apple-system', 'sans-serif'],
      },
      spacing: {
        'header': 'var(--header-height)',
        'sidebar': 'var(--sidebar-width)',
        'sidebar-collapsed': 'var(--sidebar-collapsed-width)',
      },
      keyframes: {
        'accordion-down': {
          from: { height: '0' },
          to: { height: 'var(--radix-accordion-content-height)' },
        },
        'accordion-up': {
          from: { height: 'var(--radix-accordion-content-height)' },
          to: { height: '0' },
        },
        'float': {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-20px)' },
        },
        'float-delayed': {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-15px)' },
        },
        'pulse-glow': {
          '0%, 100%': { opacity: '0.4' },
          '50%': { opacity: '0.8' },
        },
        'gradient-x': {
          '0%, 100%': { 'background-position': '0% 50%' },
          '50%': { 'background-position': '100% 50%' },
        },
        'arrow-shoot': {
          '0%': { transform: 'translateY(12px) scale(0.8)', opacity: '0' },
          '30%': { transform: 'translateY(-2px) scale(1.05)', opacity: '1' },
          '60%': { transform: 'translateY(0) scale(1)', opacity: '1' },
          '100%': { transform: 'translateY(-16px) scale(0.8)', opacity: '0' },
        },
      },
      animation: {
        'accordion-down': 'accordion-down 0.2s ease-out',
        'accordion-up': 'accordion-up 0.2s ease-out',
        'float': 'float 6s ease-in-out infinite',
        'float-delayed': 'float-delayed 8s ease-in-out infinite',
        'pulse-glow': 'pulse-glow 3s ease-in-out infinite',
        'gradient-x': 'gradient-x 3s ease infinite',
        'arrow-shoot': 'arrow-shoot 1.2s ease-in-out infinite',
        'arrow-shoot-delayed': 'arrow-shoot 1.2s ease-in-out 0.15s infinite',
        'arrow-shoot-delayed-2': 'arrow-shoot 1.2s ease-in-out 0.3s infinite',
      },
    },
  },
  plugins: [require('tailwindcss-animate')],
};

export default config;
