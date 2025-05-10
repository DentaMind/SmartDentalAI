import type { Config } from "tailwindcss";

export default {
  darkMode: ["class"],
  content: ["./client/index.html", "./client/src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      colors: {
        // Base UI colors
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        chart: {
          "1": "hsl(var(--chart-1))",
          "2": "hsl(var(--chart-2))",
          "3": "hsl(var(--chart-3))",
          "4": "hsl(var(--chart-4))",
          "5": "hsl(var(--chart-5))",
        },
        sidebar: {
          DEFAULT: "hsl(var(--sidebar-background))",
          foreground: "hsl(var(--sidebar-foreground))",
          primary: "hsl(var(--sidebar-primary))",
          "primary-foreground": "hsl(var(--sidebar-primary-foreground))",
          accent: "hsl(var(--sidebar-accent))",
          "accent-foreground": "hsl(var(--sidebar-accent-foreground))",
          border: "hsl(var(--sidebar-border))",
          ring: "hsl(var(--sidebar-ring))",
        },
        // DentaMind branded colors (direct hex values for better IDE support)
        dentamind: {
          primary: "#65FF65", // Neon green
          "primary-dark": "#4cd94c", // Darker green for hover states
          "primary-light": "#a3ffa3", // Lighter green for backgrounds
          "primary-transparent": "rgba(101, 255, 101, 0.15)", // Transparent green
          black: "#0d0d0d", // Near black
          "gray-dark": "#1a1a1a", // Dark gray
          "gray-medium": "#2a2a2a", // Medium gray
          "gray-light": "#a0a0a0", // Light gray
          white: "#ffffff", // White
          success: "#00c853", // Success green
          warning: "#ffab00", // Warning yellow
          error: "#ff4d4f", // Error red
          info: "#0288d1", // Info blue
        },
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "-apple-system", "BlinkMacSystemFont", "sans-serif"],
        mono: ["Menlo", "Monaco", "Consolas", "Liberation Mono", "monospace"],
      },
      keyframes: {
        "accordion-down": {
          from: {
            height: "0",
          },
          to: {
            height: "var(--radix-accordion-content-height)",
          },
        },
        "accordion-up": {
          from: {
            height: "var(--radix-accordion-content-height)",
          },
          to: {
            height: "0",
          },
        },
        "swing": {
          "0%": { transform: "rotate(0deg)" },
          "10%": { transform: "rotate(10deg)" },
          "30%": { transform: "rotate(-8deg)" },
          "50%": { transform: "rotate(6deg)" },
          "70%": { transform: "rotate(-4deg)" },
          "90%": { transform: "rotate(2deg)" },
          "100%": { transform: "rotate(0deg)" }
        },
        "orbit": {
          "0%": { transform: "rotate(0deg) translateX(50px) rotate(0deg)" },
          "100%": { transform: "rotate(360deg) translateX(50px) rotate(-360deg)" }
        },
        "pulse-subtle": {
          "0%, 100%": { opacity: "1" },
          "50%": { opacity: "0.9" }
        },
        "loading-progress": {
          "0%": { width: "0%" },
          "50%": { width: "60%" },
          "75%": { width: "75%" },
          "90%": { width: "90%" },
          "100%": { width: "100%" }
        },
        "dots": {
          "0%": { opacity: "0.2" },
          "20%": { opacity: "1" },
          "100%": { opacity: "0.2" }
        }
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        "swing": "swing 2s ease-in-out infinite",
        "orbit": "orbit 8s linear infinite",
        "pulse-subtle": "pulse-subtle 3s ease-in-out infinite",
        "loading-progress": "loading-progress 2.5s ease-in-out infinite",
        "dots": "dots 1.4s infinite ease-in-out"
      },
      boxShadow: {
        'dentamind': '0 4px 14px 0 rgba(101, 255, 101, 0.1)',
        'dentamind-lg': '0 10px 25px -5px rgba(101, 255, 101, 0.1), 0 8px 10px -6px rgba(101, 255, 101, 0.05)',
      },
      typography: {
        DEFAULT: {
          css: {
            '--tw-prose-links': '#65FF65',
            a: {
              color: '#65FF65',
              '&:hover': {
                color: '#4cd94c',
              },
            },
          },
        },
      },
    },
  },
  plugins: [require("tailwindcss-animate"), require("@tailwindcss/typography")],
} satisfies Config;
