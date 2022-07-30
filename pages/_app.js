import { SessionProvider as AuthProvider } from "next-auth/react";
import "../styles/globals.scss";
import Layout from "@/components/Layout";

function MyApp({ Component, pageProps: { session, ...pageProps } }) {
    return (
        <AuthProvider session={session}>
            <Layout>
                <Component {...pageProps} />
            </Layout>
        </AuthProvider>
    );
}

export default MyApp;
