import useState from "react-usestateref";
import ProfilePicture from "../../../../components/ProfilePicture";
import MembersForm from "./Components/MembersForm";
import editIcon from "/assets/home/edit.svg";
import { baseUrl } from "../../../Authentication/utils/helpers";
import axios,{pictureInstance as axiosPic} from '/src/axiosInstance';
import { addNewMember } from "./utils/apiCalls";


const AddMember = () => {
  const [profilePic, setProfilePic] = useState({});
  const [userValue, setUserValue, userValueRef] = useState({ "password": "123456", "department_id": "", "name": "", "email": "", "primary_number": "", "date_of_birth": "", "gender": "", "is_active": true, "address": "", "occupation": "", "company": "", "department_head": 0, "country": "" });
  function changePic(pic) {
    setProfilePic(() => pic);
  }
  const handleChange = (name, value) => {
    setUserValue((prev) => ({ ...prev, [name]: value }));
}
async function handleSubmit() {
  const data = new FormData();
  data.append("file", profilePic.picture);
  const endpoint = "/upload";
  const path = `${baseUrl}${endpoint}`;
  console.log(data,"profilePic");

  try {
    const response =profilePic.picture && await axiosPic.post(path, data);
    if (profilePic.picture && response.status === 200) {
      const link = response.data.result.link;
      setUserValue(prev => ({ ...prev, photo: link }));
    }
      setProfilePic({});
      addNewMember(userValueRef.current); // sends data after picture link is received
  } catch (error) {
    console.log(error);
  }
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
          editable={true}
          text={""}
          alt="profile pic"
          icon={editIcon}
          name={"firstname"}
          alternative="edit button"
          className="h-[10rem] w-[10rem] outline-primaryViolet mt-3 profilePic transition-all duration-1000 mx-aut"
          textClass={"text-[32px] leading-[36px] mx-8 "}
          onChange={changePic}
          id={"profilePic"}
        />
        <div className="text-sm text-[#8F95B2] mt-3">Image size must be less <br /> than 2mb, jpeg or png</div>
      </section>

      <MembersForm user={userValue} edit={true} onChange={handleChange} onSubmit={handleSubmit} />
    </section>
  );
}

export default AddMember;