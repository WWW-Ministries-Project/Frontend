import { useAuth } from "@/context/AuthWrapper";
import { useFetch } from "@/CustomHooks/useFetch";
import { navigateRef } from "@/pages/HomePage/HomePage";
import { decodeQuery, encodeQuery } from "@/pages/HomePage/utils";
import { IMemberInfo } from "@/utils";
import { api } from "@/utils/api/apiCalls";
import { useCallback, useEffect } from "react";
import { Outlet, useNavigate, useParams, useLocation } from "react-router-dom";
import useState from "react-usestateref";
import { Banner } from "../Components/Banner";
import TabSelection from "@/pages/HomePage/Components/reusable/TabSelection";
import BannerWrapper from "@/pages/MembersPage/layouts/BannerWrapper";
import { Button, ProfilePicture } from "@/components";
import { Badge } from "@/components/Badge";

export const ProfileDetails = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const {
    user: { permissions },
  } = useAuth();
  const [details, setDetails] = useState<IMemberInfo | undefined>();
  const { id } = useParams();
  const user_id = id ? decodeQuery(id) : undefined;
  const { data } = useFetch(api.fetch.fetchAMember, {
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
        {/* <Banner
          onClick={handleEdit}
          src={details?.photo || ""}
          name={details?.name}
          department={details?.department?.name || ""}
          position={details?.position?.name || ""}
          email={details?.email || ""}
          primary_number={details?.primary_number || ""}
          membership_type={details?.membership_type}
          status={details?.status}
          id={details?.id || ""}
          showButton={permissions.manage_members}
        /> */}
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
                  <div className="flex justify-between items-cente  container mx-auto">
                    <div className="flex gap-4 items-center  ">
                      <ProfilePicture
                        className="w-24 h-24 outline outline-white"
                        src={details?.photo || ""}
                        alt="cover Image"
                        name={details?.name}
                        id="coverPic"
                      />
                      <article className="xs:hidden md:inline space-y-2">
                        <div className="font-bold text-2xl ">
                          {details?.name || "No Name"}
                        </div>
                        <div className="">{`${details?.department?.name ?? ""} ${
                          details?.department && details?.position?.name ? "|" : ""
                        } ${details?.position ?? ""} `}</div>
                        <div className="">
                          {(details?.email || "No Email") +
                            " | " +
                            (details?.primary_number || "No Phone")}
                        </div>
                        <div className="flex gap-2">
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
                      <div>
                        <Button
                          value="Edit Profile"
                          onClick={()=>handleEdit(details?.id)}
                          className="w-full  px-5 py-3 bg-transparent min-h-8  md:bg-white md:text-primary"
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
          <TabSelection
            tabs={["Member information", "Family information"]}
            selectedTab={selectedTab}
            onTabSelect={handleTabSelect}
          />
        </div>
        <div className="hideScrollbar pb-4 mx-auto rounded-b-xl overflow-y-auto">
          <Outlet
            context={{
              handleEdit,
              details: details || {},
            }}
          />
        </div>
      </section>
    </div>
  );
};