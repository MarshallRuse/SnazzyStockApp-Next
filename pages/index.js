import { useState } from "react";
import { getSession } from "next-auth/react";
import { AnimatePresence } from "framer-motion";
import CTAButton from "@/components/CTAButton";
import AuthModal from "@/components/AuthModal";

export async function getServerSideProps(context) {
    // Check if user is authenticated
    const session = await getSession(context);
    console.log("session: ", session);

    // If not, redirect to the homepage
    if (session) {
        return {
            redirect: {
                destination: "/dashboard",
                permanent: false,
            },
        };
    }

    return {
        props: {},
    };
}

export default function HomePage() {
    const [showModal, setShowModal] = useState(false);

    const openModal = () => setShowModal(true);
    const closeModal = () => setShowModal(false);
    return (
        <div className='w-full h-screen flex flex-col justify-center items-center'>
            <div className='mx-auto mb-8'>
                <h2 className='text-zinc-400 mb-4 self-start'>Welcome to</h2>
                <h1 className='mt-0'>
                    <span className='snazzy text-blueyonder-500'>Snazzy </span>
                    <span className='stones text-zinc-500'>Stock</span>
                </h1>
            </div>
            <CTAButton element='button' onClick={openModal}>
                Login
            </CTAButton>
            <AnimatePresence
                // Disable any initial animations on children that
                // are present when the component is first rendered
                initial={false}
                // Only render one component at a time.
                // The exiting component will finish its exit
                // animation before entering component is rendered
                exitBeforeEnter={true}
                // Fires when all exiting nodes have completed animating out
                onExitComplete={() => null}
            >
                {showModal && <AuthModal show={showModal} onClose={closeModal} />}
            </AnimatePresence>
        </div>
    );
}
