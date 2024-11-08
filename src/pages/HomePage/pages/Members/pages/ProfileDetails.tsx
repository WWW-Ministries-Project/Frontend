import { pictureInstance as axiosPic } from "@/axiosInstance";
import { pictureType } from "@/utils/interfaces";
import { useEffect } from "react";
import { NavLink, Outlet, useParams } from "react-router-dom";
import useState from "react-usestateref";
import Banner from "../Components/Banner";
import { fetchAMember, updateAMember } from "../utils/apiCalls";
import { initialUser } from "../utils/membersHelpers";
import { UserType } from "../utils/membersInterfaces";
import LoaderComponent from "@/pages/HomePage/Components/reusable/LoaderComponent";

const ProfileDetails = () => {
  const links = [
    { name: "Member Information", path: "info" },
    { name: "Assets", path: "assets" },
  ];
  const [queryLoading, setQueryLoading] = useState(false);
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

  useEffect(() => {
    if (id) {
      setQueryLoading(true);
      fetchAMember(id).then((res) => {
        setQueryLoading(false);
        if (res && res.status <= 202) {
          setDetails(res.data.data);
          setProfilePic({ picture: "", src: res.data.data.photo || "" });
        }
      });
    }
  }, []);

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
  // const handleSubmit = () => {
  //     setUserValue(prev=>({...prev,id:details.id}));
  //     updateAMember(userValueRef.current as UserType)

  // }
  async function handleSubmit(val:UserType) {
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
      const res = await updateAMember(userValueRef.current as UserType);
      if (res && res.status === 200) {
        setDetails(prev=>({...prev,val}))
        setLoading(false)};
    } catch (error) {
      console.log(error);
      setLoading(false);
    }
  }
  const handleCancel = () => {
    setEdit(false);
  };

  return (
    <section className=" w-full h-full mb-4 lg:container mx-auto lg:w-4/6 rounded-xl bg-white ">
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
