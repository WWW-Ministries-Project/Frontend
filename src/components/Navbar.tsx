import { useNavigate } from "react-router-dom";

const Navbar = () => {
    const navigate = useNavigate();
    
    // For external URLs, use window.location.href or an anchor tag
    const handleLogoClick = () => {
        window.location.href = "https://worldwidewordministries.org/";
        // Or alternatively:
        // window.open("https://worldwidewordministries.org/", "_blank");
    };

    return ( 
        <div className="h-16 bg-primary flex items-center p-4 sticky top-0 z-10 w-full">
            <div className="text-white cursor-pointer" onClick={handleLogoClick}>
                <img 
                    src="/assets/authentication/churchlogo.svg" 
                    alt="Church Logo" 
                    className="h-10" // Added proper sizing for the image
                />
            </div>
        </div>
    );
}
 
export default Navbar;