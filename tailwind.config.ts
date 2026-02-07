import type { Config } from "tailwindcss";

export default {
    content: [
        "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
        "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
        "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
    ],
    theme: {
        extend: {
            fontFamily: {
                sans: ['var(--font-inter)', 'system-ui', 'sans-serif'],
                serif: ['var(--font-playfair)', 'Georgia', 'serif'],
            },
            colors: {
                background: "var(--background)",
                foreground: "var(--foreground)",
                obsidian: {
                    50: '#FAFAF9',
                    100: '#F5F5F4',
                    200: '#E7E5E4',
                    300: '#D6D3D1',
                    400: '#A8A29E',
                    500: '#78716C',
                    600: '#57534E',
                    700: '#44403C',
                    800: '#292524',
                    900: '#1C1917',
                    950: '#0C0A09',
                },
                gold: {
                    50: '#FBF6EA',
                    100: '#F5EDD6',
                    200: '#EDD89F',
                    300: '#E2C577',
                    400: '#D4A94E',
                    500: '#C8973E',
                    600: '#A67B2E',
                },
                surface: {
                    primary: '#FDFBF7',
                    secondary: '#F7F3ED',
                    elevated: '#FFFFFF',
                },
            },
            borderRadius: {
                'sm': '4px',
                'md': '8px',
                'lg': '16px',
            },
        },
    },
    plugins: [],
} satisfies Config;
