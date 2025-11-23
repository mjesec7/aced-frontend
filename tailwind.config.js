/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{vue,js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            colors: {
                'lesson-purple': '#a855f7',
                'lesson-purple-light': '#f3e8ff',
                'lesson-blue': '#3b82f6',
                'lesson-blue-light': '#dbeafe',
                'lesson-green': '#22c55e',
                'lesson-green-light': '#dcfce7',
                'lesson-yellow': '#eab308',
                'lesson-yellow-light': '#fef9c3',
            }
        },
    },
    plugins: [],
}
