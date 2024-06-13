import { useState } from "react";
import ProfilePicture from "../../../../components/ProfilePicture";
import editIcon from "/assets/home/edit.svg";
import MemberInformation from "../ProfileDetails/pages/MemberInformation";


const AddMember = () => {
    const [profilePic, setProfilePic] = useState({});
  // const [userValue, setUserValue] = useState({"password": "123456","department_id": "","name": "","email": "","primary_number": "","date_of_birth": "","gender": "","is_active": true,"address": "","occupation": "","company": "","department_head": 0,"country": ""});
  function changePic(pic) {
    setProfilePic(() => pic);
  }
    return ( 
        <section>
            <div className="font-bold text-xl">Member Information</div>
            <div className="text text-[#8F95B2] mt-">
                Fill the form below with the member information
            </div>
            <section>
            <ProfilePicture
            src={profilePic.src}
            template={true}
            editable={true}
            text={""}
            alt="profile pic"
            icon={editIcon}
            name={"firstname"}
            alternative="edit button"
            className="h-[10rem] w-[10rem] mt-3 profilePic transition-all duration-1000 mx-aut"
            textClass={"text-[32px] leading-[36px] mx-8 "}
            onChange={changePic}
            id={"pic"}
          />
          <div className="text-sm text-[#8F95B2] mt-3">Image size must be less <br/> than 2mb, jpeg or png</div>
            </section>
            
            <MemberInformation/>
        </section>
     );
}
 
export default AddMember;