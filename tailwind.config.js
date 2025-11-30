/** @type {import('tailwindcss').Config} */
export default {
    // Force rebuild: 2025-11-27
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
                'tech-primary': '#6366f1', // Indigo-500 (Modern "Fun" Color)
                'tech-surface': '#f8fafc', // Slate-50 (Professional Background)
                'tech-dark': '#1e293b',    // Slate-800 (Strong Text)
            }
        },
    },
    plugins: [],
}
