/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            colors: {
                primary: '#2563EB',
                success: '#10B981',
                warning: '#F59E0B',
                danger: '#EF4444',
                background: '#F8FAFC',
                sidebar: '#1E293B',
                textMain: '#1E293B'
            },
            fontFamily: {
                poppins: ['Poppins', 'sans-serif'],
            }
        },
    },
    plugins: [],
}
