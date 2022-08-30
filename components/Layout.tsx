import type { ReactNode } from "react";
import NavMenu from "./NavMenu/NavMenu";
import { CircularProgress } from "@mui/material";
import { useSession } from "next-auth/react";

export default function Layout({ children, pagePadding = true }: { children: ReactNode; pagePadding?: boolean }) {
    const { data: session, status } = useSession();

    return status !== "loading" ? (
        <>
            {status === "authenticated" && <NavMenu />}
            <main
                className={`main min-h-screen ${status === "authenticated" ? "md:ml-14" : ""} ${
                    pagePadding ? "py-5 px-8" : ""
                }`}
            >
                {children}
            </main>
        </>
    ) : (
        <div className='w-screen h-screen flex justify-center items-center'>
            <CircularProgress />
        </div>
    );
}
