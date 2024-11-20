import { pictureInstance as axiosPic } from "@/axiosInstance";
import { useFetch } from "@/CustomHooks/useFetch";
import UsePost from "@/CustomHooks/usePost";
import LoaderComponent from "@/pages/HomePage/Components/reusable/LoaderComponent";
import api from "@/utils/apiCalls";
import { pictureType } from "@/utils/interfaces";
import { useEffect } from "react";
import { Outlet, useParams } from "react-router-dom";
import useState from "react-usestateref";
import Banner from "../Components/Banner";
import { initialUser } from "../utils/membersHelpers";
import { UserType } from "../utils/membersInterfaces";

const ProfileDetails = () => {
  const links = [
    { name: "Member Information", path: "info" },
    { name: "Assets", path: "assets" },
  ];
  const [edit, setEdit] = useState(false);
  const [profilePic, setProfilePic] = useState<pictureType>({
    picture: "",
    src: "",
  });
  const [details, setDetails] = useState<UserType>(initialUser);
  const [userValue, setUserValue, userValueRef] = useState<UserType | object>(
    {}
  );
  const [loading, setLoading] = useState(false);
  const { id } = useParams();

  const { data, loading: queryLoading } = useFetch(api.fetch.fetchAMember, {
    user_id: id!,
  });
  const {
    data: updatedData,
    loading: updateLoading,
    postData,
  } = UsePost<{ data: { data: UserType } }>(api.post.updateMember);

  useEffect(() => {
    if (id) {
      setDetails(data?.data?.data ?? initialUser);
      setProfilePic({ picture: "", src: data?.data?.data?.photo || "" });
    }
  }, [data, loading, id]);
  useEffect(() => {
    setDetails((prev) =>
      updatedData?.data?.data ? updatedData?.data?.data : prev
    );
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
    const data = new FormData();
    data.append("file", profilePic.picture);
    const endpoint = "/upload";
    const path = `${endpoint}`;
    try {
      const response: any =
        profilePic.picture && (await axiosPic.post(path, data));
      if (profilePic.picture && response.status === 200) {
        const link = response.data.result.link;
        setUserValue((prev) => ({ ...val, photo: link }));
      }
      setProfilePic((prev) => ({ ...prev, picture: "" }));
      setUserValue((prev) => ({ ...val, id: details.id }));
      await postData(userValueRef.current);
    } catch (error) {
      console.log(error);
    } finally {
      setLoading(false);
    }
  }
  const handleCancel = () => {
    setEdit(false);
  };

  return (
    <section className=" w-full h-full mb-4 lg:container mx-auto lg:w-4/6 rounded-xl bg-white shadow">
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
      />
      <div className="hideScrollbar px-8 pb-8 mx-auto lg:container bg-white rounded-xl h-[75vh]  overflow-y-auto">
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
  );
};

export default ProfileDetails;
