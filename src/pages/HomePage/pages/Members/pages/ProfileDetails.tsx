import { useFetch } from "@/CustomHooks/useFetch";
import LoaderComponent from "@/pages/HomePage/Components/reusable/LoaderComponent";
import { navigateRef } from "@/pages/HomePage/HomePage";
import { api } from "@/utils/apiCalls";
import { useEffect } from "react";
import { Outlet, useParams } from "react-router-dom";
import useState from "react-usestateref";
import Banner from "../Components/Banner";
import { initialUser } from "../utils/membersHelpers";
import { UserType } from "../utils/membersInterfaces";

const ProfileDetails = () => {
  const [details, setDetails] = useState<UserType>(initialUser);
  const { id } = useParams();
  const { data, loading: queryLoading } = useFetch(api.fetch.fetchAMember, {
    user_id: id!,
  });

  useEffect(() => {
    if (id) {
      //@ts-expect-error TODO: fix typescript issue
      setDetails(data?.data?.data ?? initialUser);
    }
  }, [data, id]);

  const handleEdit = (id: number | string) => {
    navigateRef.current &&
      navigateRef.current(
        `/home/members/add-member?member_id=${encodeURIComponent(id)}`,
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
          src={details.photo || ""}
          name={details.name}
          department={details.department?.name || ""}
          position={details.position?.name || ""}
          email={details.email}
          primary_number={details.primary_number}
          membership_type={details.membership_type}
          id={details.id}
        />
      </div>
      <section className=" w-full h-full mb-4  mx-auto    ">
        <div className="hideScrollbar  pb-4 mx-auto   rounded-b-xl  overflow-y-auto">
          <Outlet
            context={{
              handleEdit,
              details,
            }}
          />
        </div>
        {queryLoading && <LoaderComponent />}
      </section>
    </div>
  );
};

export default ProfileDetails;
