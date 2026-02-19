import React, { useMemo, useState } from "react";
import { Button } from "@/components";
import CourseSidebar from "../Component/CourseSidebar";
import { useNavigate } from "react-router-dom";
import BannerWrapper from "../layouts/BannerWrapper";
import { useFetch } from "@/CustomHooks/useFetch";
import { api } from "@/utils/api/apiCalls";
import { useAuth } from "@/context/AuthWrapper";
import mylearning from "@/assets/banner/mylearning.svg";
import { EnrolledProgramResponse } from "@/utils";



const MyLearning: React.FC = () => {
  const { user } = useAuth();
  // api
  const { data, loading } = useFetch(api.fetch.fetchUserEnrolledPrograms, {
    userId: user?.id ?? "",
  });

  const programsData = useMemo<EnrolledProgramResponse[]>(() => {
    return data?.data ?? [];
  }, [data]);
  const navigate = useNavigate();

  const [filter, setFilter] = useState<"in-progress" | "completed">("in-progress");

  const programs = programsData;

  const programStatus = [
    { id: 1, name: "In Progress", key: "in-progress", active: filter === "in-progress" },
    { id: 2, name: "Completed", key: "completed", active: filter === "completed" },
  ];

  const filteredPrograms = programs.filter((p: EnrolledProgramResponse) => {
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
      <BannerWrapper imgSrc={mylearning}>
          <div className="space-y-4 w-full">
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
            {loading ? (
              <div className="rounded-xl border border-lightGray bg-white p-6 text-sm text-primaryGray">
                Loading your enrolled programs...
              </div>
            ) : filteredPrograms.length === 0 ? (
              <div className="rounded-xl border border-lightGray bg-white p-6 text-primaryGray">
                No programs match the selected state.
              </div>
            ) : (
              filteredPrograms.map((program: EnrolledProgramResponse) => (
                <div
                  key={program.id}
                  className="flex items-center justify-between rounded-xl border border-lightGray bg-white p-4 w-full"
                >
                  <div>
                    <h3 className="mb-2 text-lg font-medium text-primary">{program.program.title}</h3>
                    <div className="text-sm text-primaryGray">
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
                      onClick={() => navigate(String(program.program.id))}
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
