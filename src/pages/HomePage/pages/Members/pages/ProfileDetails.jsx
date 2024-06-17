import { useState } from "react";
import { NavLink, Outlet } from "react-router-dom";
import Banner from "../Components/Banner";
import MemberInformation from "./MemberInformation";

const ProfileDetails = () => {
    const links =[{name:"Member Information",path:"info"},{name:"Assets",path:"assets"}]
    const [edit, setEdit] = useState(false);
    const [profilePic, setProfilePic] = useState({});
    
    function changePic(pic) {
        setProfilePic(() => pic);
    }
    const handleEdit = () => {
        setEdit(!edit);
    }


    return (
        <section className=" w-full h-full container mx-auto rounded-xl bg-white">
            <Banner onClick={handleEdit} edit={edit} src={profilePic.src} onPicChange={changePic}/>
            <div className="w-full flex justify-start gap-8 px-8 py-4 border-1 border-lightGray border-b-2">
                {links.map((link, index) => (
                    <NavLink to={link.path} className="h-full cursor-pointer" style={({ isActive }) =>
                        (isActive ? {color: "black" } : {color: "lightgray"})} key={index}>
                        {link.name}
                    </NavLink>
                ))}
            </div>
            <div className="px-8 pb-8">
            <Outlet context={{edit, handleEdit}} />
            </div>
        </section>
    );
}



export default ProfileDetails;
