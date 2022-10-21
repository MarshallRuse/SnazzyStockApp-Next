/** @type {import('tailwindcss').Config} */
module.exports = {
    content: ["./pages/**/*.{js,ts,jsx,tsx}", "./components/**/*.{js,ts,jsx,tsx}"],
    corePlugins: {
        preflight: true,
    },
    theme: {
        transitionDuration: {
            DEFAULT: "300ms",
        },
        transitionTimingFunction: {
            DEFAULT: "cubic-bezier(0.4, 0, 0.2, 1)",
        },
        fontFamily: {
            "libre-baskerville": [
                "TitleSecondary",
                "serif",
                "ui-serif",
                "Georgia",
                "Cambria",
                "Times New Roman",
                "Times",
                "serif",
            ],
            script: ["TitlePrimary", "serif", "ui-serif", "Georgia", "Cambria", "Times New Roman", "Times", "serif"],
        },
        extend: {
            animation: {
                pop: "pop 0.3s linear 1",
            },
            boxShadow: {
                light: "8px 10px 10px 0px rgba(0, 0, 0, 0.1)",
                "light-reverse": "-8px -10px 10px 0px rgba(0, 0, 0, 0.1)",
                "light-around": "8px 10px 10px 0px rgba(0, 0, 0, 0.1), -8px -10px 10px 0px rgba(0, 0, 0, 0.1)",
                lightest: "8px 10px 10px 0px rgba(0, 0, 0, 0.025)",
                "lightest-reverse": "-8px -10px 10px 0px rgba(0, 0, 0, 0.025)",
                "lightest-around": "8px 10px 10px 0px rgba(0, 0, 0, 0.1), -8px -10px 10px 0px rgba(0, 0, 0, 0.025)",
            },
            boxShadowColor: {
                bluegreenLight: "#14b6b84d",
            },
            colors: {
                blueyonder: {
                    50: "#e1e6ef",
                    100: "#c3ccde",
                    200: "#a5b3ce",
                    300: "#879abd",
                    400: "#6980ad",
                    500: "#526996",
                    600: "#425478",
                    700: "#313f5a",
                    800: "#212a3c",
                    900: "#10151e",
                },
                bluegreen: {
                    50: "#d1fafa",
                    100: "#a3f4f5",
                    200: "#75eff0",
                    300: "#47e9eb",
                    400: "#19e4e6",
                    500: "#14b6b8",
                    600: "#109293",
                    700: "#0c6d6e",
                    800: "#08494a",
                    900: "#042425",
                },
                cerise: {
                    50: "#fbdbe5",
                    100: "#f7b6cc",
                    200: "#f392b2",
                    300: "#ef6e98",
                    400: "#eb497f",
                    500: "#E72565",
                    600: "#c1154e",
                    700: "#91103a",
                    800: "#610b27",
                    900: "#300513",
                },
            },
            dropShadow: {
                light: "2px 4px 4px rgba(0,0,0,0.2)",
            },
            keyframes: {
                pop: {
                    "50%": { transform: "scale(1.2)" },
                },
            },
        },
    },
    safelist: [
        {
            pattern: /bg-(blueyonder|bluegreen|cerise)-(50|100|200|300|400|500|600|700|800|900)/,
        },
    ],
    plugins: [],
};
