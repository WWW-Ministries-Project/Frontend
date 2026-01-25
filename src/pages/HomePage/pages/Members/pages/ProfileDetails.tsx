import { useAuth } from "@/context/AuthWrapper";
import { useFetch } from "@/CustomHooks/useFetch";
import { navigateRef } from "@/pages/HomePage/HomePage";
import { decodeQuery, encodeQuery } from "@/pages/HomePage/utils";
import { IFamilyInformationRaw, IMemberInfo } from "@/utils";
import { api } from "@/utils/api/apiCalls";
import { useCallback, useEffect } from "react";
import { Outlet, useNavigate, useParams, useLocation } from "react-router-dom";
import useState from "react-usestateref";
import { Banner } from "../Components/Banner";
import TabSelection from "@/pages/HomePage/Components/reusable/TabSelection";
import BannerWrapper from "@/pages/MembersPage/layouts/BannerWrapper";
import { Button, ProfilePicture } from "@/components";
import { Badge } from "@/components/Badge";
import { AtSymbolIcon, EnvelopeIcon, PhoneIcon } from "@heroicons/react/24/outline";

export const ProfileDetails = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const {
    user: { permissions },
  } = useAuth();


  
  const [details, setDetails] = useState<IMemberInfo | undefined>();
  const [familyData, setFamilyData] = useState<IFamilyInformationRaw | undefined>()
  const { id } = useParams();
  const user_id = id ? decodeQuery(id) : undefined;
  console.log(user_id);
  
  const { data } = useFetch(api.fetch.fetchAMember, {
    user_id: user_id!,
  });
  const { data:familydata } = useFetch(api.fetch.fetchMemberFamily, {
    user_id: user_id!,
  });
  // Function to get tab based on current route
  const getTabFromRoute = useCallback(
    (pathname: string): string => {
      if (pathname.endsWith('')) {
        return "Member information";
      } else if (pathname.endsWith('/fam-info')) {
        return "Family information";
      } else if (pathname.endsWith('/programs') || pathname.split('/').pop() === id) {
        return "Enrolled programs";
      }
      return "Member information"; // Default fallback
    },
    [id]
  );

  // Initialize selectedTab based on current route
  const [selectedTab, setSelectedTab] = useState<string>(() => getTabFromRoute(location.pathname));

  // Sync tab with route changes
  useEffect(() => {
    const currentTab = getTabFromRoute(location.pathname);
    setSelectedTab(currentTab);
  }, [getTabFromRoute, location.pathname]);

  const handleTabSelect = (tab: string) => {
    setSelectedTab(tab); // Update the selected tab state
    switch (tab) {
      case "Member information":
        navigate('');
        break;
      case "Family information":
        navigate("fam-info");
        break;
      case "Enrolled programs":
        navigate("");
        break;
      default:
        navigate('info'); // Default fallback
    }
  };

  useEffect(() => {
    if (user_id) {
      setDetails(data?.data);
    }
  }, [data, user_id]);

  useEffect(() => {
    if (familydata) {
      setFamilyData(familydata.data)
    }
  }, [familydata]);

  const handleEdit = (id: number | string) => {
    if (navigateRef.current)
      navigateRef.current(
        `/home/members/manage-member?member_id=${encodeQuery(id)}`,
        {
          state: { mode: "edit" },
        }
      );
  };

  return (
    <div className="">
      <div className="sticky top-0 z-40 w-full">
        
        <Banner >
          <div className="w-full  relative text-white rounded-t-lg">
                <div
                  className="rounded-t-lg left-0 w-full h-full flex items-center justify-between  bg-cover"
                  style={{
                    // backgroundImage: `url(${coverImage1})`,
                    backgroundPosition: "center",
                    backgroundRepeat: "no-repeat",
                  }}
                >
                  <div className="sm:flex justify-between items-cente  container mx-auto">
                    <div className="flex gap-4 items-center  ">
                      <ProfilePicture
                        className=" w-24 h-24 md:w-32 md:h-32 outline outline-white"
                        textClass={" font-bold  overflow-hidden text-2xl"}
                        src={details?.photo || ""}
                        alt="cover Image"
                        name={details?.name}
                        id="coverPic"
                      />
                      <article className=" md:inline space-y-2 ">
                        <div className="font-bold text-sm md:text-2xl ">
                          {details?.name || "No Name"}
                        </div>
                        <div className="flex gap-2 text-xs md:text-sm">
                          <span>#</span><span>{details?.member_id}</span>
                        </div>
                        <div className=" md:flex items-center gap-2  text-xs md:text-sm">
                          {details?.email&&<p className="flex items-center gap-2"><span><EnvelopeIcon className="h-4"/></span><span>{details?.email}</span></p>}
                          <div className="hidden md:block">{(details?.primary_number&&details?.email)&&<p >|</p>}</div>
                          {details?.primary_number&&<p className="flex items-center gap-2 pt-2 md:pt-0"><span><PhoneIcon className="h-4"/></span><span>{details?.primary_number}</span></p>}
                        </div>
                        <div className="hidden md:flex gap-2">
                          <Badge className="text-sm  border-primary bg-white border text-primary w-fit ">
                            {details?.membership_type === "ONLINE"
                ? "Online e-church family"
                : details?.membership_type === "IN_HOUSE"? "In-person church family" :""}
                          </Badge>
                          <Badge className="text-sm border-primary bg-white border text-primary normal-case ">
                            {details?.status ?? ""}
                          </Badge>
                        </div>
                      </article>
                    </div>
                    {permissions.manage_members && (
                      <div className="pt-4 md:pt-0">
                        <Button
                          value="Edit Profile"
                          onClick={()=>handleEdit(details?.user_id!)}
                          className="w-full  px-5 py-3 bg-transparent min-h-8  bg-white text-primary text-xs md:text-sm lg:text-base "
                        />
                      </div>
                    )}
                  </div>
                </div>
              </div>
        </Banner>
      </div>
      <section className="bg-white w-full h-full mb-4 mx-auto">
        <div className="flex p-4">
          {/* <TabSelection
            tabs={["Member information", "Family information"]}
            selectedTab={selectedTab}
            onTabSelect={handleTabSelect}
          /> */}
        </div>
        <div className="hideScrollbar pb-4 mx-auto rounded-b-xl overflow-y-auto">
          
          <Outlet
            context={{
              handleEdit,
              details: details || {},
              familyData: familyData
            }}
          />
        </div>
      </section>
    </div>
  );
};