import { useEffect, useState } from "react";
import { NavLink, Outlet, useParams } from "react-router-dom";
import Banner from "../Components/Banner";
import { fetchAMember } from "../utils/apiCalls";

const ProfileDetails = () => {
    const links = [{ name: "Member Information", path: "info" }, { name: "Assets", path: "assets" }]
    const [edit, setEdit] = useState(false);
    const [profilePic, setProfilePic] = useState({ picture: "", src: "" });
    const [details, setDetails] = useState({});
    const { id }= useParams();

    useEffect(() => {
        if (id){
            fetchAMember(id).then((res) => {
                if(res && res.status <= 202) setDetails(res.data.data);
                console.log(res.data);
            })
        }
    }, [])

    function changePic(pic) {
        setProfilePic(() => pic);
    }
    const handleEdit = () => {
        setEdit(!edit);
    }
    const handleChange = (name, value) => {
        setDetails((prev) => ({ ...prev, [name]: value }));
    }


    return (
        <section className=" w-full h-full container mx-auto rounded-xl bg-white">
            <Banner onClick={handleEdit} edit={edit} src={profilePic.src} onPicChange={changePic} />
            <div className="w-full flex justify-start gap-8 px-8 py-4 border-1 border-lightGray border-b-2">
                {links.map((link, index) => (
                    <NavLink to={link.path} className="h-full cursor-pointer" style={({ isActive }) =>
                        (isActive ? { color: "black" } : { color: "lightgray" })} key={index}>
                        {link.name}
                    </NavLink>
                ))}
            </div>
            <div className="px-8 pb-8">
                <Outlet context={{ edit, handleEdit, details }} />
            </div>
        </section>
    );
}



export default ProfileDetails;
