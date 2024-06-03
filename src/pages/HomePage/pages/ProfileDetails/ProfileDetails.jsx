import { Outlet } from "react-router-dom";
import coverImage from "/src/assets/images/CoverImage.jpg";
import { useNavigate } from "react-router-dom";

const ProfileDetails = () => {

    const navigate = useNavigate();
    const handleRoute = (path) => {
        navigate(path);
    }

    return (
        <section className=" w-full h-full">
            <div className="w-full relative">
                <img src={coverImage} alt="cover Image" className="w-full" />
            </div>
            <div className="w-full flex justify-start gap-4 py-2 border-1 border-lightGray border-b-2">
                <div className="h-full text-black cursor-pointer" onClick={() => handleRoute("")}>
                    Member Information
                </div>
                <div className="h-full text-lightGray cursor-pointer" onClick={() => handleRoute("assets")}>
                    Assets
                </div>
            </div>
            <Outlet/>
        </section>
    );
}



export default ProfileDetails;
