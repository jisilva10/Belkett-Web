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
                    DEFAULT: '#db2777', // pink-600
                    foreground: '#ffffff',
                },
                secondary: {
                    DEFAULT: '#fce7f3', // pink-100
                    foreground: '#db2777', // pink-600
                },
                background: '#fdf2f8', // pink-50
                surface: '#ffffff',
                input: '#e5e7eb', // gray-200
                ring: '#db2777', // pink-600
            },
            fontFamily: {
                sans: ['Inter', 'sans-serif'],
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
