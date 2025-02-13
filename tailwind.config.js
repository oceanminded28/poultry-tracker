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
        background: "#3B6790",
        foreground: "#444444",
        primary: "#444444",
        secondary: "#E4E4E4",
        text: "#444444"
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