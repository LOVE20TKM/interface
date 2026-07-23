// tailwind.config.js

const colors = require('tailwindcss/colors');
const { fontFamily } = require('tailwindcss/defaultTheme');

/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: ['class'],
  content: ['app/**/*.{ts,tsx}', 'src/**/*.{ts,tsx}', 'components/**/*.{ts,tsx}'],
  theme: {
    container: {
      center: 'true',
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
        data: {
          personal: 'hsl(var(--data-personal))',
          public: 'hsl(var(--data-public))',
        },
        primary: {
          DEFAULT: 'hsl(var(--primary))',
          foreground: 'hsl(var(--primary-foreground))',
        },
        secondary: {
          100: 'hsl(var(--secondary-100))',
          400: 'hsl(var(--secondary-400))',
          DEFAULT: 'hsl(var(--secondary))',
          foreground: 'hsl(var(--secondary-foreground))',
        },
        destructive: {
          DEFAULT: 'hsl(var(--destructive))',
          foreground: 'hsl(var(--destructive-foreground))',
        },
        status: {
          info: {
            DEFAULT: 'hsl(var(--status-info))',
            soft: 'hsl(var(--status-info) / 0.14)',
            border: 'hsl(var(--status-info) / 0.4)',
          },
          success: {
            DEFAULT: 'hsl(var(--status-success))',
            soft: 'hsl(var(--status-success) / 0.14)',
            border: 'hsl(var(--status-success) / 0.4)',
          },
          warning: {
            DEFAULT: 'hsl(var(--status-warning))',
            soft: 'hsl(var(--status-warning) / 0.14)',
            border: 'hsl(var(--status-warning) / 0.4)',
          },
          error: {
            DEFAULT: 'hsl(var(--status-error))',
            soft: 'hsl(var(--status-error) / 0.14)',
            border: 'hsl(var(--status-error) / 0.4)',
          },
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
        chart: {
          1: 'hsl(var(--chart-1))',
          2: 'hsl(var(--chart-2))',
          3: 'hsl(var(--chart-3))',
          4: 'hsl(var(--chart-4))',
          5: 'hsl(var(--chart-5))',
        },
        greyscale: {
          50: 'hsl(var(--greyscale-50))',
          100: 'hsl(var(--greyscale-100))',
          200: 'hsl(var(--greyscale-200))',
          300: 'hsl(var(--greyscale-300))',
          400: 'hsl(var(--greyscale-400))',
          500: 'hsl(var(--greyscale-500))',
          600: 'hsl(var(--greyscale-600))',
          700: 'hsl(var(--greyscale-700))',
          800: 'hsl(var(--greyscale-800))',
          900: 'hsl(var(--greyscale-900))',
        },
        sidebar: {
          DEFAULT: 'hsl(var(--sidebar-background))',
          foreground: 'hsl(var(--sidebar-foreground))',
          primary: 'hsl(var(--sidebar-primary))',
          'primary-foreground': 'hsl(var(--sidebar-primary-foreground))',
          accent: 'hsl(var(--sidebar-accent))',
          'accent-foreground': 'hsl(var(--sidebar-accent-foreground))',
          border: 'hsl(var(--sidebar-border))',
          ring: 'hsl(var(--sidebar-ring))',
        },
        gray: colors.slate,
      },
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)',
      },
      fontFamily: {
        sans: ['var(--font-sans)', ...fontFamily.sans],
      },
      keyframes: {
        'accordion-down': {
          from: {
            height: '0',
          },
          to: {
            height: 'var(--radix-accordion-content-height)',
          },
        },
        'accordion-up': {
          from: {
            height: 'var(--radix-accordion-content-height)',
          },
          to: {
            height: '0',
          },
        },
      },
      animation: {
        'accordion-down': 'accordion-down 0.2s ease-out',
        'accordion-up': 'accordion-up 0.2s ease-out',
      },
    },
  },
  daisyui: {
    themes: [
      'light',
      {
        dark: {
          'color-scheme': 'dark',
          primary: '#f5f5f5',
          'primary-content': '#171717',
          secondary: '#7c73ff',
          'secondary-content': '#ffffff',
          accent: '#3b82f6',
          'accent-content': '#ffffff',
          neutral: '#262626',
          'neutral-content': '#f5f5f5',
          'base-100': '#171717',
          'base-200': '#212121',
          'base-300': '#2a2a2a',
          'base-content': '#f5f5f5',
          info: '#60a5fa',
          success: '#34d399',
          warning: '#fbbf24',
          error: '#f87171',
          '--rounded-box': '0.5rem',
          '--rounded-btn': '0.375rem',
          '--rounded-badge': '9999px',
          '--tab-radius': '0.375rem',
        },
      },
    ],
  },
  plugins: [require('daisyui'), require('tailwindcss-animate'), require('@tailwindcss/typography')],
};
