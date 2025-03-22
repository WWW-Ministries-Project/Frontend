import Badge from "@/components/Badge";
import Button from "@/components/Button";
import PageOutline from "@/pages/HomePage/Components/PageOutline";
import AllCohortsPage from "../Components/AllCohort";
import Modal from "@/components/Modal";
import { useState } from "react";
import CohortForm from "../Components/CohortForm";

const ViewProgram = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const cohort = {
    id: 1,
    title: "Biblical Leadership",
    description: "A comprehensive program on biblical principles of leadership",
    eligibility: "both",
    topics: ["Biblical Leadership Foundations", "Character Development", "Vision Casting", "Team Building"],
    cohorts: [
      {
        id: 101,
        name: "Spring 2023",
        description: "First cohort of the Biblical Leadership program",
        startDate: "2023-06-01",
        duration: "12 weeks",
        applicationDeadline: "2023-05-15",
        status: "Active",
        classes: [
          {
            id: 1001,
            name: "Monday Evening Class",
            instructor: "Pastor James Wilson",
            capacity: 15,
            enrolled: 12,
            format: "in-person",
            location: "Main Campus - Room 201",
            schedule: "Mondays, 7:00 PM - 9:00 PM",
          },
          {
            id: 1002,
            name: "Wednesday Morning Class",
            instructor: "Elder Sarah Johnson",
            capacity: 15,
            enrolled: 8,
            format: "hybrid",
            location: "Main Campus - Fellowship Hall",
            meetingLink: "https://zoom.us/j/123456789",
            schedule: "Wednesdays, 10:00 AM - 12:00 PM",
          },
          {
            id: 1003,
            name: "Online Weekend Class",
            instructor: "Dr. Michael Brown",
            capacity: 20,
            enrolled: 4,
            format: "online",
            meetingLink: "https://zoom.us/j/987654321",
            schedule: "Saturdays, 9:00 AM - 11:00 AM",
          },
        ],
      },
    ],
  };

  return (
    <div className="px-4">
      <PageOutline className="p-0">
        <section className="bg-primary p-4 space-y-3 rounded-t-lg sticky top-0">
          <div className="container mx-auto flex justify-between">
            <div className="space-y-3">
              <div>
              <div className="flex gap-4 items-center">
                <h1 className="text-white  md:text-2xl font-bold">{cohort.title}</h1>
                <Badge className="bg-green/80 border-green/30 font-medium text-xs text-dark900">Open to all</Badge>
              </div>
              <p className="text-white text-sm">{cohort.description}</p>
              </div>

              <div className="space-y-1">
                <p className="text-white text-lg font-semibold">Topics</p>
                <div className="flex flex-wrap gap-2">
                  {cohort.topics.map((topic, index) => (
                    <Badge key={index} className="bg-lightGray border-lightGray font-medium text-sm text-dark900">
                      {topic}
                    </Badge>
                  ))}
                </div>
              </div>
            </div>

            <div className="hidden md:block">
              <div className="flex items-center gap-2">
                <Button value="Edit Program" className="p-2 m-1 text-primary min-h-10 max-h-14 bg-white" />
                <Button value="View Application Page" className="p-2 m-1 text-white min-h-10 max-h-14 border border-white" />
              </div>
            </div>
          </div>
        </section>

        <section>
            <AllCohortsPage onCreate={() => setIsModalOpen(true)}/>
        </section>

       
      </PageOutline>
      <Modal open={isModalOpen} onClose={() => setIsModalOpen(false)}>
        <CohortForm 
          onClose={() => setIsModalOpen(false)} 
          onSubmit={(data) => console.log("Form submitted:", data)} 
        />
      </Modal>
    </div>
  );
};

export default ViewProgram;
