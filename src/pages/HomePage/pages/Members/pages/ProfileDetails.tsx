import { useAuth } from "@/context/AuthWrapper";
import { useFetch } from "@/CustomHooks/useFetch";
import { navigateRef } from "@/pages/HomePage/HomePage";
import { encodeQuery } from "@/pages/HomePage/utils";
import { IMemberInfo } from "@/utils";
import { api } from "@/utils/api/apiCalls";
import { useEffect } from "react";
import { Outlet, useParams } from "react-router-dom";
import useState from "react-usestateref";
import { Banner } from "../Components/Banner";

export const ProfileDetails = () => {
  const {
    user: { permissions },
  } = useAuth ();
  const [details, setDetails] = useState<IMemberInfo | undefined>();
  const { id } = useParams();
  const { data } = useFetch(api.fetch.fetchAMember, {
    user_id: id!,
  });

  useEffect(() => {
    if (id) {
      setDetails(data?.data);
    }
  }, [data, id]);

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
      <section className=" w-full h-full mb-4  mx-auto    ">
        <div className="hideScrollbar  pb-4 mx-auto   rounded-b-xl  overflow-y-auto">
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
