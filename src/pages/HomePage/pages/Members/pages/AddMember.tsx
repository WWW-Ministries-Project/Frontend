import { pictureInstance as axiosPic } from "@/axiosInstance";
import { pictureType } from "@/utils/interfaces";
import { useNavigate } from "react-router-dom";
import useState from "react-usestateref";
import ProfilePicture from "../../../../../components/ProfilePicture";
import { memberValues } from "../../../../../utils/helperFunctions";
import { baseUrl } from "../../../../Authentication/utils/helpers";
import MembersForm from "../Components/MembersForm";
import { addNewMember } from "../utils/apiCalls";
import editIcon from "/assets/home/edit.svg";
import { UserType } from "../utils/membersInterfaces";

const AddMember = () => {
  const [profilePic, setProfilePic] = useState<pictureType>({
    picture: "",
    src: "",
  });
  const [loading, setLoading] = useState(false);
  const [userValue, setUserValue, userValueRef] = useState(memberValues);
  const navigate = useNavigate();
  function changePic(pic: pictureType) {
    setProfilePic(() => pic);
  }
  const handleChange = (name: string, value: string | boolean) => {
    setUserValue((prev) => ({ ...prev, [name]: value }));
  };
  const handleCancel = () => {
    setUserValue(memberValues);
    setProfilePic({ picture: "", src: "" });
    navigate("/home/members");
  };
  async function handleSubmit(val:UserType) {
    setLoading(true);
    const data = new FormData();
    data.append("file", profilePic.picture);
    const endpoint = "/upload";
    const path = `${baseUrl}${endpoint}`;
    try {
      const response: any =
        profilePic.picture && (await axiosPic.post(path, data));
      if (profilePic.picture && response.status === 200) {
        const link = response.data.result.link;
        setUserValue((prev) => ({ ...prev, val, photo: link }));
      }
      setProfilePic({ picture: "", src: "" });
      setUserValue(prev=>({...prev,...val}))
      const res = await addNewMember(userValueRef.current);
      if (res && res.status === 200) navigate("/home/members"); // sends data after picture link is received
    } catch (error) {
      console.log(error);
      setLoading(false);
    }
  }
  return (
    <section className="hideScrollbar mx-auto p-8 container bg-white rounded-xl xl:h-[90vh] lg:h-[73vh] overflow-y-auto">
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
            className="h-[10rem] w-[10rem] outline-primaryViolet mt-3 profilePic transition-all duration-1000 mx-aut"
            textClass={"text-[32px] leading-[36px] mx-8 "}
            onChange={changePic}
            id={"profilePic"}
          />
          <div className="text-sm text-[#8F95B2] mt-3">
            Image size must be less <br /> than 2mb, jpeg or png
          </div>
        </section>
      </div>
      <MembersForm
        user={userValue}
        edit={true}
        onChange={handleChange}
        onSubmit={handleSubmit}
        onCancel={handleCancel}
        // disabled={!userValue.email || !userValue.first_name || loading}
        loading={loading}
      />
    </section>
  );
};

export default AddMember;
