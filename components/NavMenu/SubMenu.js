import { useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import HoverStyledAnchor from "./HoverStyledAnchor";
import KeyboardArrowDown from "@mui/icons-material/KeyboardArrowDown";

export default function SubMenu({ menuLabel = "", MenuIcon, link = "", children, ...rest }) {
    const [open, setOpen] = useState(false);

    return (
        <>
            <div className='w-full flex  hover:cursor-pointer' onClick={() => setOpen(!open)}>
                {link ? (
                    <Link href={link} passHref>
                        <HoverStyledAnchor className='navItem flex-wrap'>
                            {MenuIcon && <MenuIcon />}
                            {menuLabel}
                        </HoverStyledAnchor>
                    </Link>
                ) : (
                    <span className='text-blueyonder-500'>
                        {MenuIcon && <MenuIcon />}
                        {menuLabel}
                    </span>
                )}

                <div className='flex-grow text-right'>
                    <motion.span
                        animate={open ? "open" : "collapsed"}
                        variants={{
                            open: { rotate: 180 },
                            collapsed: { rotate: 0 },
                        }}
                        initial='collapsed'
                        transition={{ type: "tween", duration: 0.2, ease: [0.04, 0.62, 0.23, 0.98] }}
                        className='inline-block'
                    >
                        <KeyboardArrowDown className='expansionIcon' />
                    </motion.span>
                </div>
            </div>
            <motion.ul
                animate={open ? "open" : "collapsed"}
                variants={{
                    open: { opacity: 1, height: "auto" },
                    collapsed: { opacity: 0, height: 0, overflow: "hidden" },
                }}
                initial='collapsed'
                transition={{ type: "tween", duration: 0.2, ease: [0.04, 0.62, 0.23, 0.98] }}
                className='pl-4 border-l-2'
                {...rest}
            >
                {children}
            </motion.ul>
        </>
    );
}
