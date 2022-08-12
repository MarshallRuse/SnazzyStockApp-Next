import Link from "next/link";
import MenuListItem from "./MenuListItem";
import SubMenu from "./SubMenu";
import HoverStyledAnchor from "./HoverStyledAnchor";
import { IMenuItem } from "lib/interfaces/IMenuItem";

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
            <Link href={menuItem.link}>
                <HoverStyledAnchor className='navItem'>
                    {menuItem.displayIcon && <menuItem.displayIcon />}
                    {menuItem.displayText}
                </HoverStyledAnchor>
            </Link>
        )}
    </MenuListItem>
);

const Sidebar = ({ menuContents = [] }: { menuContents: IMenuItem[] }) => {
    return (
        <div className='hidden md:block'>
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
                    {menuContents.map((menuItem, ind) => (
                        <RecursiveMenuItem key={`${menuItem.displayText}-${ind}`} menuItem={menuItem} />
                    ))}
                </ul>
            </nav>
        </div>
    );
};

export default Sidebar;
