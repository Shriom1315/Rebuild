/** @type {import('tailwindcss').Config} */
module.exports = {
    content: [
        "./src/**/*.{js,jsx,ts,tsx}",
    ],
    theme: {
        extend: {
            colors: {
                brand: {
                    DEFAULT: "#FF6B00",
                    50: "#FFF4EB",
                    100: "#FFE4CC",
                    200: "#FFC999",
                    300: "#FFAD66",
                    400: "#FF8C33",
                    500: "#FF6B00",
                    600: "#CC5600",
                    700: "#994000",
                },
                dark: {
                    DEFAULT: "#0A0A0A",
                    50: "#1A1A1A",
                    100: "#2A2A2A",
                    200: "#333333",
                },
                light: {
                    DEFAULT: "#FFFFFF",
                    50: "#FAFAFA",
                    100: "#F5F5F5",
                    200: "#EEEEEE",
                    300: "#E0E0E0",
                    400: "#BDBDBD",
                },
            },
            fontFamily: {
                display: ['"DM Serif Display"', 'Georgia', 'serif'],
                sans: ['Inter', 'system-ui', 'sans-serif'],
                mono: ['"Fira Code"', 'monospace'],
            },
            fontSize: {
                'hero': ['clamp(3rem, 8vw, 7rem)', { lineHeight: '1.05', letterSpacing: '-0.02em' }],
                'section': ['clamp(2rem, 5vw, 4rem)', { lineHeight: '1.1', letterSpacing: '-0.02em' }],
            },
            borderRadius: {
                'pill': '100px',
            },
            boxShadow: {
                'card': '0 1px 3px rgba(0,0,0,0.04), 0 1px 2px rgba(0,0,0,0.06)',
                'card-hover': '0 10px 40px rgba(0,0,0,0.08)',
                'glow-orange': '0 0 40px -10px rgba(255, 107, 0, 0.3)',
            },
        },
    },
    plugins: [],
};
