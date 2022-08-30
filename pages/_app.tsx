import { SessionProvider as AuthProvider } from "next-auth/react";
import resolveConfig from "tailwindcss/resolveConfig";
import tailwindConfig from "../tailwind.config.js";
import "../styles/globals.scss";
import Layout from "components/Layout";
import { Toaster } from "react-hot-toast";
import type { AppProps } from "next/app";
import { createTheme, ThemeProvider } from "@mui/material/styles";

// https://tailwindcss.com/docs/configuration#referencing-in-java-script
// Note that this will transitively pull in a lot of our build-time dependencies,
// resulting in bigger bundle client-side size. To avoid this, we recommend using
// a tool like babel-plugin-preval to generate a static version of your configuration
//  at build-time.
const fullConfig = resolveConfig(tailwindConfig);

declare module "@mui/material/styles/createPalette" {
    interface CommonColors {
        brand: PaletteColor;
    }
}

const theme = createTheme({
    palette: {
        primary: {
            main: fullConfig.theme.colors.bluegreen[500],
            dark: fullConfig.theme.colors.bluegreen[700],
            light: fullConfig.theme.colors.bluegreen[300],
            contrastText: "#fff",
        },
        secondary: {
            main: fullConfig.theme.colors.cerise[500],
            dark: fullConfig.theme.colors.cerise[700],
            light: fullConfig.theme.colors.cerise[300],
        },
        text: {
            primary: fullConfig.theme.colors.zinc[500],
        },
        common: {
            brand: {
                main: fullConfig.theme.colors.blueyonder[500],
                dark: fullConfig.theme.colors.blueyonder[700],
                light: fullConfig.theme.colors.blueyonder[300],
                contrastText: "#fff",
            },
        },
    },
});

function MyApp({ Component, pageProps: { session, pagePadding, ...pageProps } }: AppProps) {
    return (
        <>
            <AuthProvider session={session}>
                <ThemeProvider theme={theme}>
                    <Layout pagePadding={pagePadding}>
                        <Component {...pageProps} />
                    </Layout>
                </ThemeProvider>
            </AuthProvider>
            <Toaster />
        </>
    );
}

export default MyApp;
