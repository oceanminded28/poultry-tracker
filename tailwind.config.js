/** @type {import('tailwindcss').Config} */
const config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "#E4E4E4",
        foreground: "#335E3B",
        primary: "#335E3B",    // green
        secondary: "#FFD97D",  // yellow
        accent: "#FEC4B6",     // coral/pink
        text: "#444444",       // dark gray
      },
      fontFamily: {
        sans: ['Quicksand', 'sans-serif'],
        mono: ['Quicksand', 'sans-serif'],
      },
    },
  },
  plugins: [],
};

export default config; 