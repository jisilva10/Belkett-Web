/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            colors: {
                primary: {
                    DEFAULT: '#be123c', // rose-700
                    foreground: '#ffffff',
                },
                secondary: {
                    DEFAULT: '#fdf2f8', // pink-50
                    foreground: '#be123c', // rose-700
                },
                accent: {
                    DEFAULT: '#fb7185', // rose-400
                    foreground: '#ffffff',
                },
                background: '#fafaf9', // stone-50 (warm gray)
                surface: '#ffffff',
                input: '#e7e5e4', // stone-200
                ring: '#be123c', // rose-700
            },
            fontFamily: {
                sans: ['Outfit', 'sans-serif'],
            },
            animation: {
                'fade-in': 'fadeIn 0.3s ease-out forwards',
                'slide-up': 'slideUp 0.3s ease-out forwards',
            },
            keyframes: {
                fadeIn: {
                    '0%': { opacity: '0' },
                    '100%': { opacity: '1' },
                },
                slideUp: {
                    '0%': { transform: 'translateY(10px)', opacity: '0' },
                    '100%': { transform: 'translateY(0)', opacity: '1' },
                },
            },
        },
    },
    plugins: [],
}
