import Navbar from "./NavMenu/NavBar";
import { useSession } from "next-auth/react";

export default function Layout({ children }) {
    const { data: session, status } = useSession();
    console.log("status: ", status);

    return (
        <>
            {status === "authenticated" && <Navbar />}
            <main className={`main min-h-screen ${status === "authenticated" ? "md:ml-60" : ""} py-5 px-8`}>
                {children}
            </main>
        </>
    );
}
