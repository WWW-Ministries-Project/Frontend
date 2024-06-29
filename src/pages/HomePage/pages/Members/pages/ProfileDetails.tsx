import { pictureInstance as axiosPic } from "@/axiosInstance";
import { pictureType } from "@/utils/interfaces";
import { useEffect } from "react";
import { NavLink, Outlet, useParams } from "react-router-dom";
import useState from "react-usestateref";
import Banner from "../Components/Banner";
import { fetchAMember, updateAMember } from "../utils/apiCalls";
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

  useEffect(() => {
    if (id) {
      fetchAMember(id).then((res) => {
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
    <section className=" w-full h-full container mx-auto rounded-xl bg-white 2xl:h-[90vh] lg:h-[89vh] xl:h-[87vh] md:h-[87vh] sm:h-[84vh] xs:h-[89vh]">
      <Banner
        onClick={handleEdit}
        edit={edit}
        src={profilePic.src}
        onPicChange={changePic}
        name={details.name}
        department={details.department?.name || "no department"}
        position={details.position?.name || "no position"}
        email={details.email}
        primary_number={details.primary_number}
      />
      {/* <div className="w-full flex justify-start gap-8 px-8 py-4 border-1 border-lightGray border-b-2">
        {links.map((link, index) => (
          <NavLink
            to={link.path}
            className="h-full cursor-pointer"
            style={({ isActive }) =>
              isActive ? { color: "black" } : { color: "lightgray" }
            }
            key={index}
          >
            {link.name}
          </NavLink>
        ))}
      </div> */}
      <div className="hideScrollbar px-8 pb-8 2xl:h-[70vh] xl:h-[60vh] lg:h-[62vh] md:h-[70vh] sm:h-[66vh] xs:h-[68vh] overflow-y-auto">
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
    </section>
  );
};

export default ProfileDetails;
