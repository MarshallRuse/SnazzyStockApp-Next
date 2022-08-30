import { useState, ReactElement, ReactNode } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import HoverStyledAnchor from "./HoverStyledAnchor";
import KeyboardArrowDown from "@mui/icons-material/KeyboardArrowDown";

type Props = {
    menuLabel?: string;
    MenuIcon?: () => ReactElement | null;
    link?: string;
    children: ReactNode;
};

export default function SubMenu({ menuLabel = "", MenuIcon = null, link = "", children, ...rest }: Props) {
    const [open, setOpen] = useState(false);

    return (
        <>
            <div className='w-full flex hover:cursor-pointer flex-nowrap' onClick={() => setOpen(!open)}>
                {link ? (
                    <Link href={link} passHref>
                        <HoverStyledAnchor className='navItem flex-nowrap'>
                            {MenuIcon && <MenuIcon />}
                            <span className='opacity-0 pointer-events-none transition duration-300 group-hover:opacity-100 group-hover:pointer-events-auto'>
                                {menuLabel}
                            </span>
                        </HoverStyledAnchor>
                    </Link>
                ) : (
                    <span className='flex text-blueyonder-500 flex-nowrap'>
                        {MenuIcon && <MenuIcon />}
                        <span className='opacity-0 pointer-events-none transition duration-300 group-hover:opacity-100 group-hover:pointer-events-auto'>
                            {menuLabel}
                        </span>
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
