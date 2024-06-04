import { useState } from "react";
import { NavLink, Outlet } from "react-router-dom";
import Banner from "./Components/Banner";

const ProfileDetails = () => {
    const links =[{name:"Member Information",path:"info"},{name:"Assets",path:"assets"}]
    const [edit, setEdit] = useState(false);
    const handleEdit = () => {
        setEdit(!edit);
    }


    return (
        <section className=" w-full h-full">
            <Banner onClick={handleEdit} edit={edit}/>
            <div className="w-full flex justify-start gap-4 py-2 border-1 border-lightGray border-b-2">
                {links.map((link, index) => (
                    <NavLink to={link.path} className="h-full cursor-pointer" style={({ isActive }) =>
                        (isActive ? {color: "black" } : {color: "lightgray"})} key={index}>
                        {link.name}
                    </NavLink>
                ))}
            </div>
            <Outlet context={{edit, handleEdit}} />
        </section>
    );
}



export default ProfileDetails;
