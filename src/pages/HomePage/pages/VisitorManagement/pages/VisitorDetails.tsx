import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";  // Import useParams from react-router-dom
import PageOutline from "@/pages/HomePage/Components/PageOutline";
import Banner from "../../Members/Components/Banner";
import TabSelection from "@/pages/HomePage/Components/reusable/TabSelection";
import Visits from "./Visit";
import FollowUps from "./FollowUps";
import PrayerRequest from "./PrayerRequest";
import Note from "./Notes";
// import { ApiCalls } from "@/utils/apiFetch";  // Assuming you have an API utility to fetch data
import HeaderControls from "@/components/HeaderControls";
import { formatTime } from "@/utils/helperFunctions";
import ListDetailComp from "../../DashBoard/Components/ListDetailComp";
import { PhoneIcon } from "@heroicons/react/24/solid";
import SkeletonLoader from "@/pages/HomePage/Components/reusable/SkeletonLoader";
import TableSkeletonLoader from "@/pages/HomePage/Components/TableSkeleton";
import BannerSkeletonLoader from "@/pages/HomePage/Components/reusable/BannerSkeletonLoader";

const VisitorDetails = () => {
  const  {visitorId}  = useParams();  // Get the visitor id from route params
  const [selectedTab, setSelectedTab] = useState<string>("Visit");
  const [visitor, setVisitor] = useState<any>(null);  // Store visitor data
  const [loading, setLoading] = useState<boolean>(true);  // Handle loading state
  const [error, setError] = useState<string | null>(null); // Handle error state

  // const apiCalls = new ApiCalls();  // Assuming you have an API utility to fetch data

  // Step 1: Fetch visitor details on component mount using the id from route params
  const fetchVisitorData = async () => {
    try {
      setLoading(true);
      if (!visitorId) {
        throw new Error("Visitor ID is undefined.");
      }
      // const response = await apiCalls.fetchVisitorById(visitorId);  // Ensure id is a string
      if (response?.data) {
        setVisitor(response.data.data);
      } else {
        setError("Visitor not found.");
      }
    } catch (err) {
      setError("An error occurred while fetching visitor data.");
    } finally {
      setLoading(false);
      console.log("Fetched visitor data", visitor);
    }
  }; 

  useEffect(() => {
    if (visitorId) {
      fetchVisitorData();  // Fetch data only if id exists
    }
  }, [visitorId]);  // Run this effect when the `id` changes (e.g., when the URL changes)

  const handleTabSelect = (tab: string) => {
    setSelectedTab(tab);  // Update the selected tab state
  };

  // if (loading) {
  //   return <div>Loading visitor data...</div>;  // Show a loading state
  // }

  if (error) {
    return <div>{error}</div>;  // Show an error message if any
  }

  return (
    <div className="p-4">
      <PageOutline className="p-0">
        {loading?<BannerSkeletonLoader/>
        :(visitor && (
          <Banner
          name={`${visitor.firstName} ${visitor.lastName}`}
            email={visitor?.email }
            primary_number={visitor?.phone || "123-456-7890"}
            onClick={() => console.log("Banner clicked")}
            edit={false}
            onPicChange={(newPic) => console.log("Picture changed", newPic)}
            loading={loading}
          />
        ))}
        <div className="grid grid-cols-3 gap-4 p-4">
        <section className=" col-span-2 ">
          <div className="flex  mb-6">
            {loading?
            <div className="animate-pulse flex gap-4  justify-between  w-[40rem] border p-1 rounded-lg">
            <div className="h-8 bg-lightGray rounded w-2/6"></div>
            <div className="h-8 bg-lightGray rounded w-2/6"></div>
            <div className="h-8 bg-lightGray rounded w-2/6"></div>
            </div>
            :<TabSelection
              tabs={["Visit", "Follow-ups", "Prayer Requests", "Note"]}
              selectedTab={selectedTab}  // Pass selectedTab
              onTabSelect={handleTabSelect}  // Pass the function to update selectedTab
            />}
          </div>
          {loading?
          <div className="space-y-4">
            <div className="animate-pulse space-y-2  w-[40rem] ">
            <div className="h-8 bg-lightGray rounded w-2/6"></div>
            <div className="h-6 bg-lightGray rounded w-4/6"></div>
            </div>
            <TableSkeletonLoader/>
          </div>
          :<div>
            {/* Step 2: Conditionally render content based on selectedTab */}
            {selectedTab === "Visit" && <Visits visits={visitor?.visits} visitorId={visitor?.id} fetchVisitorData={fetchVisitorData}/>}
            {selectedTab === "Follow-ups" && <FollowUps followUps={visitor?.followUps} visitorId={visitor?.id} fetchVisitorData={fetchVisitorData}/>}
            {selectedTab === "Prayer Requests" && <PrayerRequest prayerRequests={visitor?.prayerRequests} />}
            {selectedTab === "Note" && <Note notes={visitor?.notes} />}
          </div>}
        </section>
        <section className="text-primary">
          {loading?
          <div  className="animate-pulse border border-1 border-lightGray p-4 rounded-lg space-y-4 text-primary flex flex-col">
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
          :<div className=" border rounded-lg p-4 space-y-4">
            
            <HeaderControls
            title="Visitor Details"
            subtitle={`Visitor since: ${formatTime(visitor?.visitDate) }`}
            showSubtitle={true}
            />
            <div className="space-y-3">
              <ListDetailComp
              icon={<PhoneIcon />}
              title={visitor?.email}
              />
              <ListDetailComp
              icon={'s'}
              title={visitor?.phone}
              />
              <ListDetailComp
              icon={'s'}
              title={`${visitor?.country} - ${visitor?.state}`}
              />
            </div>

            <div>
            <hr/>
            </div>

            <div>
              <div className="font-semibold">How they heard about us:</div>
              <div>{visitor?.howHeard}</div>
            </div>
          </div>}
        </section>
        </div>
      </PageOutline>
    </div>
  );
};

export default VisitorDetails;
