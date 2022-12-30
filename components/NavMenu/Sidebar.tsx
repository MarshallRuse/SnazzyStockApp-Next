import Link from "next/link";
import MenuListItem from "./MenuListItem";
import SubMenu from "./SubMenu";
import HoverStyledAnchor from "./HoverStyledAnchor";
import { IMenuItem } from "lib/interfaces/IMenuItem";
import Image from "next/image";

const RecursiveMenuItem = ({ menuItem }: { menuItem: IMenuItem }) => (
    <MenuListItem
        className={`${menuItem.submenu ? "menuParent" : ""} w-full`}
        key={`nav-menu-${menuItem.displayText.replace(" ", "-")}`}
        widescreen={true}
    >
        {menuItem.submenu && menuItem.submenu.length > 0 ? (
            <SubMenu
                menuLabel={menuItem.displayText}
                MenuIcon={menuItem.displayIcon}
                link={menuItem.isLink ? menuItem.link : ""}
            >
                {menuItem.submenu.map((sub: IMenuItem) => (
                    <RecursiveMenuItem key={`sub-${sub.displayText}`} menuItem={sub} />
                ))}
            </SubMenu>
        ) : (
            <Link href={menuItem.link} passHref>
                <HoverStyledAnchor className='navItem'>
                    {menuItem.displayIcon && <menuItem.displayIcon />}
                    <span className='opacity-0 pointer-events-none transition duration-300 group-hover:opacity-100 group-hover:pointer-events-auto'>
                        {menuItem.displayText}
                    </span>
                </HoverStyledAnchor>
            </Link>
        )}
    </MenuListItem>
);

const Sidebar = ({ menuContents = [] }: { menuContents: IMenuItem[] }) => {
    return (
        <div className='hidden md:block md:z-50'>
            <nav className='fixed top-0 left-0 bottom-0 w-14 overflow-x-hidden z-50 py-4 flex flex-col gap-6 items-center align-center bg-white border-r border-bluegreen-500 transition-all duration-200 hover:w-60 group'>
                <div className='relative w-full h-14'>
                    <Link href='/'>
                        <a className='absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 opacity-100 transition duration-300 group-hover:opacity-0 group-hover:pointer-events-none'>
                            <Image src='/svg/SnazzyIcon.svg' width={24} height={24} alt='Snazzy Stones logo' />
                        </a>
                    </Link>
                    <Link href='/'>
                        <a className='absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 opacity-0 pointer-events-none transition duration-300 group-hover:opacity-100 group-hover:pointer-events-auto'>
                            <h3 className='text-center text-3xl whitespace-nowrap'>
                                <span className='snazzy text-blueyonder-500'>Snazzy </span>
                                <span className='stones text-zinc-700'>Stones</span>
                            </h3>
                        </a>
                    </Link>
                </div>
                <ul
                    className={`flex flex-col flex-auto items-start gap-2 px-4 z-10 w-full overflow-y-auto overflow-x-hidden subtleScrollbar bg-white text-base text-blueyonder-500 border-t border-bluegreen-500`}
                >
                    {menuContents.map((menuItem, ind) => (
                        <RecursiveMenuItem key={`${menuItem.displayText}-${ind}`} menuItem={menuItem} />
                    ))}
                </ul>
            </nav>
        </div>
    );
};

export default Sidebar;
