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
      if (pathname.endsWith('/info')) {
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
        navigate('info');
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
    <div className="px-4">
      <div className="sticky top-0 z-40 w-full">
        <Banner
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
        />
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