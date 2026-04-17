import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        panel: "#1b1d23",
        panelAlt: "#22252d",
        border: "#2e3139",
        accent: "#6366f1",
        accentHover: "#4f46e5",
      },
    },
  },
  plugins: [],
};

export default config;
