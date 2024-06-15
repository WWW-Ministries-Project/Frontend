import { useNavigate } from "react-router-dom";
import useState from "react-usestateref";
import ProfilePicture from "../../../../components/ProfilePicture";
import { memberValues } from "../../../../utils/helperFunctions";
import { baseUrl } from "../../../Authentication/utils/helpers";
import MembersForm from "./Components/MembersForm";
import { addNewMember } from "./utils/apiCalls";
import editIcon from "/assets/home/edit.svg";
import { pictureInstance as axiosPic } from '/src/axiosInstance';


const AddMember = () => {
  const [profilePic, setProfilePic] = useState({});
  const [loading, setLoading] = useState(false);
  const [userValue, setUserValue, userValueRef] = useState(memberValues);
  const navigate = useNavigate();
  function changePic(pic) {
    setProfilePic(() => pic);
  }
  const handleChange = (name, value) => {
    setUserValue((prev) => ({ ...prev, [name]: value }));
  }
  const handleCancel = () => {
    setUserValue(memberValues);
    setProfilePic({});
    navigate("/home/members");
  }
  async function handleSubmit() {
    setLoading(true);
    const data = new FormData();
    data.append("file", profilePic.picture);
    const endpoint = "/upload";
    const path = `${baseUrl}${endpoint}`;
    try {
      const response = profilePic.picture && await axiosPic.post(path, data);
      if (profilePic.picture && response.status === 200) {
        const link = response.data.result.link;
        setUserValue(prev => ({ ...prev, photo: link }));
      }
      setProfilePic({});
      addNewMember(userValueRef.current); // sends data after picture link is received
      setLoading(false);
    } catch (error) {
      console.log(error);
      setLoading(false);
    }
  }
  return (
    <section >
      <div className="flex flex-col gap-4 items-center tablet:items-start">
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
            alternative="edit button"
            className="h-[10rem] w-[10rem] outline-primaryViolet mt-3 profilePic transition-all duration-1000 mx-aut"
            textClass={"text-[32px] leading-[36px] mx-8 "}
            onChange={changePic}
            id={"profilePic"}
          />
          <div className="text-sm text-[#8F95B2] mt-3">Image size must be less <br /> than 2mb, jpeg or png</div>
        </section>
      </div>
      <MembersForm user={userValue} edit={true} onChange={handleChange} onSubmit={handleSubmit} onCancel={handleCancel} disabled={!userValue.email || !userValue.first_name} loading={loading} />
    </section>
  );
}

export default AddMember;