import { useState, useEffect } from "react";
import Image from "next/image";
import { signIn } from "next-auth/react";
import { motion } from "framer-motion";
import Button from "@mui/material/Button";
import Close from "@mui/icons-material/Close";

const dropIn = {
    hidden: {
        y: "-100vh",
        opacity: 0,
    },
    visible: {
        y: "0",
        opacity: 1,
        transition: {
            duration: 0.1,
            type: "spring",
            damping: 25,
            stiffness: 500,
        },
    },
    exit: {
        y: "100vh",
        opacity: 0,
    },
};

const Backdrop = ({ children, onClick }) => {
    return (
        <motion.div
            onClick={onClick}
            className='fixed top-0 left-0 bottom-0 right-0 p-12 bg-blueyonder-700/75'
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
        >
            {children}
        </motion.div>
    );
};

export default function AuthModal({ show = false, onClose = () => null }) {
    const [disabled, setDisabled] = useState(false);
    const [showConfirm, setConfirm] = useState(false);
    const [showSignIn, setShowSignIn] = useState(false);

    const signInWithGoogle = () => {
        setDisabled(true);
        //Perform sign in
        signIn("google", {
            callbackUrl: window.location.href,
        });
    };

    const closeModal = () => {
        if (typeof onClose === "function") {
            onClose();
        }
    };

    // Reset modal
    useEffect(() => {
        if (!show) {
            // Wait for 200ms for aniamtion to finish
            setTimeout(() => {
                setDisabled(false);
                setConfirm(false);
                setShowSignIn(false);
            }, 200);
        }
    }, [show]);

    return (
        <Backdrop onClick={closeModal}>
            <motion.div
                onClick={(e) => e.stopPropagation()}
                className='h-full max-w-md mx-auto bg-white flex flex-col justify-between items-center p-4 md:p-8 rounded-md shadow-light'
                variants={dropIn}
                initial='hidden'
                animate='visible'
                exit='exit'
            >
                <div className='flex flex-col flex-auto items-center '>
                    <h1 className='text-5xl text-blueyonder-500 font-libre-baskerville'>Login / Sign-Up</h1>
                    <p className='text-zinc-500'>Login or sign-up with:</p>
                    <button
                        disabled={disabled}
                        onClick={signInWithGoogle}
                        className='h-[46px] w-full mx-auto border rounded-md p-2 flex justify-center items-center space-x-2 text-gray-500 hover:text-gray-600 hover:border-gray-400 hover:bg-gray-50 focus:outline-none focus:ring-4 focus:ring-gray-400 focus:ring-opacity-25 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:text-gray-500 disabled:hover:bg-transparent disabled:hover:border-gray-200 transition-colors'
                    >
                        <Image src='/svg/google.svg' alt='Google' width={32} height={32} />
                        <span>Authenticate with Google</span>
                    </button>
                </div>
                <Button onClick={closeModal} className='w-max p-2 text-zinc-500' variant='outlined'>
                    <Close fontSize='small' />
                    Close
                </Button>
            </motion.div>
        </Backdrop>
    );
}
