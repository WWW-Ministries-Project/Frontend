import Navbar from "@/components/Navbar";
import { Button } from "../../components"
import { Outlet, useNavigate } from "react-router-dom";

function LandingPage() {
    const navigate = useNavigate();

    return (
        <div className="bg-[url('https://res.cloudinary.com/akwaah/image/upload/v1740860331/background_oswjfy.jpg')] bg-no-repeat bg-right bg-cover min-h-screen">
            <div className="bg-primary/60 min-h-screen backdrop-blur-sm">
                {/* Sticky Navbar */}
                <div className="sticky top-0 z-50 bg-primary/60 ">
                    <Navbar />
                </div>
                
                {/* Page Content */}
                <div className="w-full">
                    <Outlet />
                </div>
            </div>
        </div>
    )
}

export default LandingPage