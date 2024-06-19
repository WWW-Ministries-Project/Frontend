import { useEffect, useState } from "react";
import { NavLink, Outlet, useParams } from "react-router-dom";
import Banner from "../Components/Banner";
import { fetchAMember } from "../utils/apiCalls";
import { pictureType } from "@/utils/interfaces";
import { UserType } from "../utils/membersInterfaces";

const ProfileDetails = () => {
    const links = [{ name: "Member Information", path: "info" }, { name: "Assets", path: "assets" }]
    const [edit, setEdit] = useState(false);
    const [profilePic, setProfilePic] = useState<pictureType>({ picture: "", src: "" });
    const [details, setDetails] = useState<UserType>({primary_number:"",email:"",name:""});
    const { id }= useParams();

    useEffect(() => {
        if (id){
            fetchAMember(id).then((res) => {
                if(res && res.status <= 202) setDetails(res.data.data);
            })
        }
    }, [])

    function changePic(pic:pictureType) {
        setProfilePic(() => pic);
    }
    const handleEdit = (bool:boolean) => {
        setEdit(bool);
    }
    const handleChange = (name:string, value:string) => {
        setDetails((prev) => ({ ...prev, [name]: value }));
    }


    return (
        <section className=" w-full h-full container mx-auto rounded-xl bg-white">
            <Banner onClick={handleEdit} edit={edit} src={profilePic.src} onPicChange={changePic} name={details.name} department={details.department?.name||"no department"} position={details.position?.name||"no position"} email={details.email} primary_number={details.primary_number} />
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
