import { useEffect, useState } from "react";
import { useSession } from 'next-auth/react';
import Sidebar from "./Sidebar";
import MobileNav from "./mobile/MobileNav";
import type { IMenuItem } from "lib/interfaces/IMenuItem";
import type { ProductCategoryTree } from "lib/interfaces/IProductCategoryTree";
import Assessment from "@mui/icons-material/Assessment";
import Category from "@mui/icons-material/Category";
import Clipboard from "@mui/icons-material/Assignment";
import Settings from "@mui/icons-material/Settings";
import ShoppingBasket from "@mui/icons-material/ShoppingBasket";
import ShoppingCart from "@mui/icons-material/ShoppingCart";
import Storefront from "@mui/icons-material/Storefront";

export default function NavMenu() {
    const { data: session, status } = useSession();

    const [menuContents, setMenuContents] = useState<IMenuItem[]>([
        {
            isLink: true,
            link: "/checkout",
            displayText: "Checkout",
            displayIcon: () => <ShoppingCart fontSize='small' className='mr-2' />,
        },
        {
            isLink: true,
            link: "/sales",
            displayText: "Sales",
            displayIcon: () => <Clipboard fontSize='small' className='mr-2' />,
        },
        {
            isLink: true,
            link: "/products",
            displayText: "Products",
            submenu: [], // NavBar and MobileNav check if a submenu property exists before rendering contents.  Products subcategories are dynamic based on categories stored in db
            displayIcon: () => <Storefront fontSize='small' className='mr-2' />,
        },
        {
            isLink: true,
            link: "/analytics",
            displayText: "Analytics",
            displayIcon: () => <Assessment fontSize='small' className='mr-2' />,
        },
        {
            isLink: true,
            link: "/purchases",
            displayText: "Purchases",
            displayIcon: () => <ShoppingBasket fontSize='small' className='mr-2' />,
        },
        {
            isLink: false,
            displayText: "Settings",
            displayIcon: () => <Settings fontSize='small' className='mr-2' />,
            submenu: [
                {
                    isLink: true,
                    link: "/product-category-settings",
                    displayText: "Product Categories",
                    displayIcon: () => <Category fontSize='small' className='mr-2' />,
                },
            ],
        },
    ]);

    // deep copy of an n-ary tree
    const categoryChildrenToSubMenus = (root: ProductCategoryTree | null): IMenuItem | null => {
        if (root === null) {
            return null;
        }
        const newRoot: IMenuItem = {
            isLink: true,
            link: `/products?category=${root.name}`,
            displayText: root.name,
            submenu: [],
        };

        root.children.forEach((child: ProductCategoryTree) => {
            const submenuItem = categoryChildrenToSubMenus(child);
            if (submenuItem !== null) {
                newRoot.submenu.push(submenuItem);
            }
        });

        return newRoot;
    };

    const fetchCategoryMenuItems = async () => {
        const categoriesResponse = await fetch("/api/product_categories?hierarchy=true");
        if (categoriesResponse.status === 200){
            const categories: ProductCategoryTree[] = await categoriesResponse.json();
            console.log("categories: ", categories);
            const menuItems: IMenuItem[] = categories?.map((cat: ProductCategoryTree) =>
                categoryChildrenToSubMenus(cat)
            );

            menuItems.sort((a: IMenuItem, b: IMenuItem) =>
                a.displayText > b.displayText ? 1 : b.displayText > a.displayText ? -1 : 0
            );

            const menuContentsCopy = [...menuContents];
            const productsIndex = menuContentsCopy.findIndex((menuItem) => menuItem.displayText === "Products");
            menuContentsCopy[productsIndex].submenu = menuItems;
            setMenuContents(menuContentsCopy);
        }
        
    };

    useEffect(() => {
        if (status === "authenticated"){
            fetchCategoryMenuItems();
        }
        
    }, [status]);

    return (
        <>
            <Sidebar menuContents={menuContents} />
            <MobileNav menuContents={menuContents} />
        </>
    );
}
