import { NavLink, Outlet } from "react-router-dom";
import coverImage from "/src/assets/images/CoverImage.jpg";

const ProfileDetails = () => {
    const links =[{name:"Member Information",path:"info"},{name:"Assets",path:"assets"}]


    return (
        <section className=" w-full h-full">
            <div className="w-full relative">
                <img src={coverImage} alt="cover Image" className="w-full" />
            </div>
            <div className="w-full flex justify-start gap-4 py-2 border-1 border-lightGray border-b-2">
                {links.map((link, index) => (
                    <NavLink to={link.path} className="h-full cursor-pointer" style={({ isActive }) =>
                        (isActive ? {color: "black" } : {color: "lightgray"})} key={index}>
                        {link.name}
                    </NavLink>
                ))}
            </div>
            <Outlet/>
        </section>
    );
}



export default ProfileDetails;
