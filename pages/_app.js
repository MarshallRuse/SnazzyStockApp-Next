import { SessionProvider as AuthProvider } from "next-auth/react";
import "../styles/globals.scss";
import Layout from "components/Layout";
import { Toaster } from "react-hot-toast";

function MyApp({ Component, pageProps: { session, ...pageProps } }) {
    return (
        <>
            <AuthProvider session={session}>
                <Layout>
                    <Component {...pageProps} />
                </Layout>
            </AuthProvider>
            <Toaster />
        </>
    );
}

export default MyApp;
