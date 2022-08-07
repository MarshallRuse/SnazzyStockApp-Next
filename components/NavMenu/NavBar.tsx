import Link from "next/link";
import { menuContents } from "./menuContents";
import MenuListItem from "./MenuListItem";
import HoverStyledAnchor from "./HoverStyledAnchor";
import SubMenu from "./SubMenu";
import MobileNav from "./mobile/MobileNav";

export default function NavBar() {
    return (
        <nav className='fixed top-0 left-0 bottom-0 w-60 z-10 py-4 flex flex-col gap-6 items-center align-center bg-white border-r border-bluegreen-500 '>
            <Link href='/'>
                <a className='flex justify-self-start'>
                    <h3 className='text-center text-3xl whitespace-nowrap'>
                        <span className='snazzy text-blueyonder-500'>Snazzy </span>
                        <span className='stones text-zinc-700'>Stones</span>
                    </h3>
                </a>
            </Link>
            <ul
                className={`flex flex-col flex-auto items-start gap-6 pl-8 pr-4 z-10 w-full overflow-y-auto subtleScrollbar bg-white text-base text-blueyonder-500 border-t border-bluegreen-500`}
            >
                {menuContents.map((menuItem) => (
                    <MenuListItem
                        className={`${menuItem.submenu ? "menuParent" : ""} w-full`}
                        key={`nav-menu-${menuItem.displayText.replace(" ", "-")}`}
                        widescreen={true}
                    >
                        {menuItem.submenu ? (
                            <SubMenu
                                menuLabel={menuItem.displayText}
                                MenuIcon={menuItem.displayIcon}
                                link={menuItem.isLink ? menuItem.link : ""}
                            >
                                {menuItem.submenu.map((sub) => (
                                    <MenuListItem
                                        key={`sub-menu-${sub.displayText.replace(" ", "-")}`}
                                        widescreen={true}
                                    >
                                        <Link href={sub.link} passHref>
                                            <HoverStyledAnchor className='navItem'>
                                                {sub.displayIcon && <sub.displayIcon />}
                                                {sub.displayText}
                                            </HoverStyledAnchor>
                                        </Link>
                                    </MenuListItem>
                                ))}
                            </SubMenu>
                        ) : (
                            <Link href={menuItem.link}>
                                <HoverStyledAnchor className='navItem'>
                                    {menuItem.displayIcon && <menuItem.displayIcon />}
                                    {menuItem.displayText}
                                </HoverStyledAnchor>
                            </Link>
                        )}
                    </MenuListItem>
                ))}
            </ul>
            <div className='md:hidden cursor-pointer w-12 h-12 z-20 relative text-bluegreen-500'>
                <MobileNav />
            </div>
        </nav>
    );
}
