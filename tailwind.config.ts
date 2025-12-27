import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
        primary: {
          DEFAULT: "var(--primary)",
          blue: "var(--primary-blue)",
          purple: "var(--primary-purple)",
          orange: "var(--primary-orange)",
        },
        card: {
          DEFAULT: "var(--card)",
          border: "var(--card-border)",
        },
      },
      backgroundImage: {
        "gradient-radial": "radial-gradient(var(--tw-gradient-stops))",
        "gradient-conic": "conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))",
        "gradient-mesh": "linear-gradient(135deg, var(--primary-blue) 0%, var(--primary-purple) 100%)",
      },
      boxShadow: {
        "glow-blue": "0 0 20px rgba(59, 130, 246, 0.5)",
        "glow-orange": "0 0 20px rgba(249, 115, 22, 0.5)",
        "glow-purple": "0 0 20px rgba(168, 85, 247, 0.5)",
      },
      animation: {
        "gradient-mesh": "gradient-mesh 15s ease infinite",
      },
      keyframes: {
        "gradient-mesh": {
          "0%, 100%": { backgroundPosition: "0% 50%" },
          "50%": { backgroundPosition: "100% 50%" },
        },
      },
    },
  },
  plugins: [],
};
export default config;

