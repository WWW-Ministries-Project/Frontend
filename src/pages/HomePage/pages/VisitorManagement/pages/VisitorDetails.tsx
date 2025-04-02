import { useState } from "react";
import PageOutline from "@/pages/HomePage/Components/PageOutline";
import Banner from "../../Members/Components/Banner";
import TabSelection from "@/pages/HomePage/Components/reusable/TabSelection";
import Visits from "./Visit";
import FollowUps from "./FollowUps";
import PrayerRequest from "./PrayerRequest";
import Note from "./Notes";

const VisitorDetails = () => {
    // Step 1: Track the selected tab in state
    const [selectedTab, setSelectedTab] = useState<string>('Visit');

    // Step 2: Function to handle tab selection
    const handleTabSelect = (tab: string) => {
        setSelectedTab(tab);  // Update the selected tab state
    };

    const visitor = {
        id: "1",
        firstName: "John",
        lastName: "Smith",
        email: "john.smith@example.com",
        phone: "(555) 123-4567",
        address: "123 Main St",
        city: "Springfield",
        state: "IL",
        zipCode: "62701",
        firstVisitDate: "2023-04-02",
        howHeard: "Friend or Family",
        interestedIn: ["Church Membership", "Small Groups"],
        prayerRequests: [
          {
            id: "1",
            date: "2023-04-02",
            request: "Please pray for my mother who is in the hospital.",
            status: "active",
          },
        ],
        notes: [
          {
            id: "1",
            date: "2023-04-02",
            author: "Pastor Adam",
            content:
              "John seemed very interested in our community outreach programs. Follow up about volunteer opportunities.",
          },
        ],
        visits: [
          {
            id: "1",
            date: "2023-04-02",
            eventName: "Sunday Morning Service",
            eventType: "service",
          },
          {
            id: "2",
            date: "2023-04-09",
            eventName: "Sunday Morning Service",
            eventType: "service",
          },
          {
            id: "3",
            date: "2023-04-16",
            eventName: "Community Outreach",
            eventType: "event",
          },
        ],
        followUps: [
          {
            id: "1",
            date: "2023-04-04",
            type: "phone",
            status: "completed",
            notes: "Called to thank John for visiting. He expressed interest in the men's Bible study.",
            assignedTo: "Pastor Adam",
          },
          {
            id: "2",
            date: "2023-04-11",
            type: "email",
            status: "completed",
            notes: "Sent email with information about upcoming events and small groups.",
            assignedTo: "Sarah Johnson",
          },
          {
            id: "3",
            date: "2023-04-18",
            type: "in-person",
            status: "pending",
            notes: "Schedule coffee meeting to discuss membership process.",
            assignedTo: "Pastor Adam",
          },
        ],
      }

    return ( 
        <div className="p-4">
            <PageOutline className="p-0">
                <Banner 
                    department="Visitor Management" 
                    position="Guest" 
                    email="visitor@example.com" 
                    primary_number="123-456-7890" 
                    src="/path/to/image.jpg" 
                    onClick={() => console.log('Banner clicked')} 
                    edit={false} 
                    onPicChange={(newPic) => console.log('Picture changed', newPic)} 
                />
                <section className="p-4">
                    <div className="flex mt-2 mb-6">
                        {/* Step 3: Pass selectedTab and onTabSelect to TabSelection */}
                        <TabSelection 
                            tabs={['Visit', 'Follow-ups', 'Prayer Requests', "Note"]} 
                            selectedTab={selectedTab}  // Pass selectedTab
                            onTabSelect={handleTabSelect}  // Pass the function to update selectedTab
                        />
                    </div>
                    {/* Step 4: Conditionally render content based on selectedTab */}
                    <div>
                        {selectedTab === 'Visit' && <Visits />}
                        {selectedTab === 'Follow-ups' && <FollowUps />}
                        {selectedTab === 'Prayer Requests' && <PrayerRequest />}
                        {selectedTab === 'Note' && <Note />}
                    </div>
                </section>
            </PageOutline>
        </div>
     );
}
 
export default VisitorDetails;
