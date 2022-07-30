import Assessment from "@mui/icons-material/Assessment";
import Category from "@mui/icons-material/Category";
import Clipboard from "@mui/icons-material/Assignment";
import Settings from "@mui/icons-material/Settings";
import ShoppingBasket from "@mui/icons-material/ShoppingBasket";
import ShoppingCart from "@mui/icons-material/ShoppingCart";
import Storefront from "@mui/icons-material/Storefront";

export async function fetchCategoryMenuItems() {
    const categoriesResponse = await fetch("/api/retail/categories");
    const responseJson = await categoriesResponse.json();
    const categories = responseJson.categories;
    const menuItems = categories.map((cat) => ({
        isLink: true,
        link: `/retail/categories/${cat.title.replace(" ", "_")}`,
        displayText: cat.title,
    }));

    return menuItems.sort((a, b) => (a.displayText > b.displayText ? 1 : b.displayText > a.displayText ? -1 : 0));
}

export const menuContents = [
    {
        isLink: true,
        link: "/",
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
];
