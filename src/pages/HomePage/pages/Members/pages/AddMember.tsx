import { pictureInstance as axiosPic } from "@/axiosInstance";
import NotificationCard from "@/components/NotificationCard";
import { useStore } from "@/store/useStore";
import { pictureType } from "@/utils/interfaces";
import { useNavigate } from "react-router-dom";
import useState from "react-usestateref";
import ProfilePicture from "../../../../../components/ProfilePicture";
import { memberValues } from "../../../../../utils/helperFunctions";
import { baseUrl } from "../../../../Authentication/utils/helpers";
import MembersForm from "../Components/MembersForm";
import { addNewMember } from "../utils/apiCalls";
import { UserType } from "../utils/membersInterfaces";
import editIcon from "/assets/home/edit.svg";

const AddMember = () => {
  const store = useStore();
  const navigate = useNavigate();

  const [notification, setNotification] = useState<{
    type: "error" | "success";
    message: string;
    show: boolean;
  }>({ type: "error", message: "", show: false });
  const [profilePic, setProfilePic] = useState<pictureType>({
    picture: "",
    src: "",
  });
  const [loading, setLoading] = useState(false);
  const [userValue, setUserValue, userValueRef] = useState(memberValues);
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
  async function handleSubmit(val: UserType) {
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
      setUserValue((prev) => ({ ...prev, ...val }));
      const res = await addNewMember(userValueRef.current);
      if (res && res.status === 200) {
        const temp = {
          ...res.data.data,
          ...res.data.data.user_info,
          name: res.data.data.name,
          email: res.data.data.email,
        };
        store.addMember(temp);
        navigate("/home/members", { state: { new: true } });
      }
    } catch (error) {
      console.log(error);
      setLoading(false);
      setNotification({
        type: "error",
        message: "Something went wrong",
        show: true,
      });
    }
  }
  return (
    <>
      <section className="mx-auto py-8 px-16 lg:container lg:w-4/6 bg-white rounded-xl shadow-lg">
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
              className="h-[10rem] w-[10rem] outline-primaryViolet mt-3 profilePic transition-all outline outline-1 duration-1000 mx-auto"
              textClass={"text-[32px] leading-[36px] "}
              onChange={changePic}
              id={"profilePic"}
            />
            <div className="text-xs text-[#8F95B2] mt-3">
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
      {notification.show && (
        <NotificationCard
          type={notification.type}
          title={"Success"}
          description={notification.message}
          onClose={() =>
            setNotification({ type: "error", message: "", show: false })
          }
        />
      )}
    </>
  );
};

export default AddMember;
