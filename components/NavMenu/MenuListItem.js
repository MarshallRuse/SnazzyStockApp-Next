const widescreenComponent = "hidden md:flex md:flex-col items-start py-6";
const mobileComponent = "flex flex-col items-start py-6";

export default function MenuListItem({ children, className, widescreen = false, ...rest }) {
    return (
        <li className={`${widescreen ? widescreenComponent : mobileComponent} ${className}`} {...rest}>
            {children}
        </li>
    );
}
