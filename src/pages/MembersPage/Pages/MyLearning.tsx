import React, { useMemo, useState } from "react";
import { Button } from "@/components";
import CourseSidebar from "../Component/CourseSidebar";
import { useNavigate } from "react-router-dom";
import { Banner } from "@/pages/HomePage/pages/Members/Components/Banner";
import BannerWrapper from "../layouts/BannerWrapper";
import { useFetch } from "@/CustomHooks/useFetch";
import { api } from "@/utils/api/apiCalls";
import { useAuth } from "@/context/AuthWrapper";

interface BackendProgram {
  id: number;
  user_id: number;
  course_id: number;
  enrolledAt: string;
  completed: boolean;
  completedAt: string | null;
  instructor: {
    id: number;
    name: string;
  };
  cohort: {
    id: number;
    name: string;
    status: string;
    startDate: string;
    duration: string;
  };
  program: {
    id: number;
    title: string;
  };
  course: {
    id: number;
    name: string;
    schedule: string;
    classFormat: string;
    location: string;
    meetingLink: string;
  };
}

const MyLearning: React.FC = () => {
  const { user } = useAuth();
  // api
  const {data, loading, refetch} = useFetch(api.fetch.fetchUserEnrolledPrograms, user?.id);

  const programsData = useMemo(() => data?.data || [], [data]);
  console.log("My Prog data", programsData);
  console.log("user data", user);
  
  const navigate = useNavigate();

  const [filter, setFilter] = useState<"in-progress" | "completed">("in-progress");

  const programs = useMemo<BackendProgram[]>(() => {
    return programsData || [];
  }, [programsData]);

  const programStatus = [
    { id: 1, name: "In Progress", key: "in-progress", active: filter === "in-progress" },
    { id: 2, name: "Completed", key: "completed", active: filter === "completed" },
  ];

  const filteredPrograms = programs.filter((p) => {
    if (filter === "completed") return p.completed === true;
    return p.completed === false;
  });

  const handleStatusSelect = (id: string | number) => {
    // map sidebar id to filter key
    if (id === 1 || id === "1") setFilter("in-progress");
    if (id === 2 || id === "2") setFilter("completed");
  };

  return (
    <div>
      <BannerWrapper>
          <div className="space-y-4">
            <div className="font-bold text-3xl">My Learning</div>
            <div>Overview of your learning progress and materials.</div>
          </div>
        </BannerWrapper>
      {/* Section */}
      <main className="mx-auto py-8 ">
        <div className="flex flex-col gap-6 lg:flex-row">
          <div className="w-full lg:w-64">
            {/* Use CourseSidebar to render program status filters */}
            <CourseSidebar
              heading="State"
              // CourseSidebar expects navItems shaped like {id, name, active}
              navItems={programStatus.map((s) => ({ id: s.id, name: s.name, active: s.active }))}
              onSelect={handleStatusSelect}
            />

            
          </div>

          <div className="flex flex-col gap-4 lg:flex-1">
            {filteredPrograms.length === 0 ? (
              <div className="rounded-xl border border-gray-300 p-6 bg-white">No programs match the selected state.</div>
            ) : (
              filteredPrograms.map((program) => (
                <div
                  key={program.id}
                  className="flex items-center border border-gray-300 rounded-xl justify-between p-4 w-full bg-white"
                >
                  <div>
                    <h3 className="font-medium text-lg mb-2">{program.program.title}</h3>
                    <div className="text-sm text-gray-600">
                      <div><span className="font-medium">Instructor:</span> {program.instructor.name}</div>
                      <div><span className="font-medium">Cohort:</span> {program.cohort.name}</div>
                      <div><span className="font-medium">Schedule:</span> {program.course.schedule}</div>
                      <div><span className="font-medium">Format:</span> {program.course.classFormat}</div>
                      <div><span className="font-medium">Location:</span> {program.course.location}</div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    {/* <span className="text-sm text-muted-foreground">{program.status}</span> */}
                    <Button
                      variant="secondary"
                      value="View program"
                      onClick={() => navigate(String(program.course.id))}
                    />
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default MyLearning;