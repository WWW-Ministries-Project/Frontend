import PageOutline from "@/pages/HomePage/Components/PageOutline";
import TabSelection from "@/pages/HomePage/Components/reusable/TabSelection";
import { useMemo, useState } from "react";
import { useParams } from "react-router-dom"; // Import useParams from react-router-dom
import { Banner } from "../../Members/Components/Banner";
import { Visits } from "../Components/Visit";
// import { ApiCalls } from "@/utils/apiFetch";  // Assuming you have an API utility to fetch data
import { HeaderControls } from "@/components/HeaderControls";
import { useFetch } from "@/CustomHooks/useFetch";
import BannerSkeletonLoader from "@/pages/HomePage/Components/reusable/BannerSkeletonLoader";
import TableSkeletonLoader from "@/pages/HomePage/Components/TableSkeleton";
import { api } from "@/utils";
import { formatDate } from "@/utils/helperFunctions";
import { PhoneIcon } from "@heroicons/react/24/solid";
import ListDetailComp from "../../DashBoard/Components/ListDetailComp";
import { FollowUps } from "../Components/FollowUps";
import { Note } from "../Components/Notes";
import { PrayerRequest } from "../Components/PrayerRequest";

const VisitorDetails = () => {
  const { visitorId } = useParams();
  const [selectedTab, setSelectedTab] = useState<string>("Visit");

  const { data, loading } = useFetch(api.fetch.fetchVisitorById, {
    id: visitorId!,
  });
  const visitor = useMemo(() => data?.data, [data]);

  const handleTabSelect = (tab: string) => {
    setSelectedTab(tab); // Update the selected tab state
  };

  return (
    <div className="p-4">
      <PageOutline className="p-0">
        {loading ? (
          <BannerSkeletonLoader />
        ) : (
          visitor && (
            <Banner
              name={`${visitor.firstName} ${visitor.lastName}`}
              id={visitor.id}
              src={
                "https://media.istockphoto.com/id/587805156/vector/profile-picture-vector-illustration.jpg?s=612x612&w=0&k=20&c=gkvLDCgsHH-8HeQe7JsjhlOY6vRBJk_sKW9lyaLgmLo="
              }
              email={visitor?.email}
              primary_number={visitor?.phone}
              onClick={() => console.log("Banner clicked")}
            />
          )
        )}
        <div className="grid grid-cols-3 gap-4 p-4">
          <section className=" col-span-2 ">
            <div className="flex  mb-6">
              {loading ? (
                <div className="animate-pulse flex gap-4  justify-between  w-[40rem] border p-1 rounded-lg">
                  <div className="h-8 bg-lightGray rounded w-2/6"></div>
                  <div className="h-8 bg-lightGray rounded w-2/6"></div>
                  <div className="h-8 bg-lightGray rounded w-2/6"></div>
                </div>
              ) : (
                <TabSelection
                  tabs={["Visit", "Follow-ups", "Prayer Requests", "Note"]}
                  selectedTab={selectedTab} // Pass selectedTab
                  onTabSelect={handleTabSelect} // Pass the function to update selectedTab
                />
              )}
            </div>
            {loading ? (
              <div className="space-y-4">
                <div className="animate-pulse space-y-2  w-[40rem] ">
                  <div className="h-8 bg-lightGray rounded w-2/6"></div>
                  <div className="h-6 bg-lightGray rounded w-4/6"></div>
                </div>
                <TableSkeletonLoader />
              </div>
            ) : (
              <div>
                {/* Step 2: Conditionally render content based on selectedTab */}
                {selectedTab === "Visit" && (
                  <Visits
                    visits={visitor?.visits || []}
                    visitorId={visitorId!}
                  />
                )}
                {selectedTab === "Follow-ups" && (
                  <FollowUps
                    followUps={visitor?.followUps || []}
                    visitorId={visitorId!}
                    // fetchVisitorData={fetchVisitorData}
                  />
                )}
                {selectedTab === "Prayer Requests" && <PrayerRequest />}
                {selectedTab === "Note" && <Note />}
              </div>
            )}
          </section>
          <section className="text-primary">
            {loading ? (
              <div className="animate-pulse border border-1 border-lightGray p-4 rounded-lg space-y-4 text-primary flex flex-col">
                <div className="flex  justify-between">
                  <div className="h-6 bg-lightGray rounded w-3/5"></div>
                  <div className="h-4 bg-lightGray rounded w-1/5"></div>
                </div>
                <div className="h-4 bg-lightGray rounded w-1/2"></div>
                <div className="h-4 bg-lightGray rounded w-3/4"></div>
                <div className="space-y-2">
                  <div className="h-4 bg-lightGray rounded w-2/3"></div>
                  <div className="h-4 bg-lightGray rounded w-1/2"></div>
                </div>
                <div className="flex justify-between space-x-2">
                  <div className="h-10 bg-lightGray rounded w-1/3"></div>
                  <div className="h-10 bg-lightGray rounded w-1/3"></div>
                </div>
              </div>
            ) : (
              <div className=" border rounded-lg p-4 space-y-4">
                <HeaderControls
                  title="Visitor Details"
                  subtitle={`Visitor since: ${formatDate(
                    visitor?.visitDate || ""
                  )}`}
                />
                <div className="space-y-3">
                  <ListDetailComp
                    icon={<PhoneIcon />}
                    title={visitor?.email || ""}
                  />
                  <ListDetailComp icon={"s"} title={visitor?.phone || ""} />
                  <ListDetailComp
                    icon={"s"}
                    title={`${visitor?.country} - ${visitor?.state}`}
                  />
                </div>

                <div>
                  <hr />
                </div>

                <div>
                  <div className="font-semibold">How they heard about us:</div>
                  <div>{visitor?.howHeard}</div>
                </div>
              </div>
            )}
          </section>
        </div>
      </PageOutline>
    </div>
  );
};

export default VisitorDetails;
