import { pictureInstance as axiosPic } from "@/axiosInstance";
import { useFetch } from "@/CustomHooks/useFetch";
import { usePost } from "@/CustomHooks/usePost";
import LoaderComponent from "@/pages/HomePage/Components/reusable/LoaderComponent";
import { useNotificationStore } from "@/pages/HomePage/store/globalComponentsStore";
import {api} from "@/utils/apiCalls";
import { pictureType } from "@/utils/interfaces";
import { useEffect } from "react";
import { Outlet, useParams } from "react-router-dom";
import useState from "react-usestateref";
import Banner from "../Components/Banner";
import { initialUser } from "../utils/membersHelpers";
import { UserType } from "../utils/membersInterfaces";

const ProfileDetails = () => {
  const [edit, setEdit] = useState(false);
  const [profilePic, setProfilePic] = useState<pictureType>({
    picture: "",
    src: "",
  });
  const [details, setDetails] = useState<UserType>(initialUser);
  const [, setUserValue, userValueRef] = useState<UserType | object>({});
  const [loading, setLoading] = useState(false);
  const { id } = useParams();

  const { data, loading: queryLoading } = useFetch(api.fetch.fetchAMember, {
    user_id: id!,
  });
  const {
    data: updatedData,
    postData,
    error,
  } = usePost<{ data: { data: UserType } }>(api.post.updateMember);

  const NotificationStore = useNotificationStore();

  useEffect(() => {
    if (id) {
      setDetails(data?.data?.data ?? initialUser);
      setProfilePic({ picture: "", src: data?.data?.data?.photo || "" });
    }
  }, [data, id]);
  useEffect(() => {
    if (updatedData) {
      setDetails((prev) =>
        updatedData?.data?.data
          ? { ...updatedData?.data?.data, ...updatedData?.data?.data.user_info }
          : prev
      );
      NotificationStore.setNotification({
        type: "success",
        message: "Member updated successfully",
        onClose: () => {},
        show: true,
      });
    }
    if (error) {
      NotificationStore.setNotification({
        type: "error",
        message: error.message,
        onClose: () => {},
        show: true,
      });
    }
  }, [updatedData]);

  function changePic(pic: pictureType) {
    setProfilePic(() => pic);
  }
  const handleEdit = (bool: boolean) => {
    setEdit(bool);
  };
  const handleChange = (name: string, value: string) => {
    setUserValue((prev) => ({ ...prev, [name]: value }));
    setDetails((prev) => ({ ...prev, [name]: value }));
  };
  async function handleSubmit(val: UserType) {
    setLoading(true);

    try {
      let photoLink = profilePic.picture ? "" : val.photo!;

      // Step 1: Handle Profile Picture Upload
      if (profilePic.picture) {
        const formData = new FormData();
        formData.append("file", profilePic.picture);

        const response = await axiosPic.post("/upload", formData);
        if (response.status === 200) {
          photoLink = response.data.result.link;
          setProfilePic((prev) => ({ ...prev, picture: "", src: photoLink }));
        }
      }
      const updatedUser = {
        ...val,
        id: details.id,
        photo: photoLink,
      };
      setUserValue(updatedUser); // Update state for userValue
      await postData(updatedUser);
    } catch (error) {
      console.error("Error during form submission:", error);
    } finally {
      setLoading(false);
    }
  }

  const handleCancel = () => {
    setEdit(false);
  };

  return (
    <div className="px-4">
       <div className="sticky top-0 z-40 w-full">
       <Banner
        onClick={handleEdit}
        edit={edit}
        src={profilePic.src}
        onPicChange={changePic}
        name={details.name}
        department={details.department?.name || ""}
        position={details.position?.name || ""}
        email={details.email}
        primary_number={details.primary_number}
        membership_type={details.membership_type}
      />
       </div>
      <section className=" w-full h-full mb-4  mx-auto    ">
     
      <div className="hideScrollbar  pb-4 mx-auto   rounded-b-xl  overflow-y-auto">
        <Outlet
          context={{
            edit,
            handleEdit,
            details,
            handleChange,
            handleSubmit,
            handleCancel,
            loading,
          }}
        />
      </div>
      {queryLoading && <LoaderComponent />}
    </section>
    </div>
  );
};

export default ProfileDetails;
