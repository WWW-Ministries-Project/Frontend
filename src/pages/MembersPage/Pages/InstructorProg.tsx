import CourseSidebar from "../Component/CourseSidebar";
import BannerWrapper from "../layouts/BannerWrapper";
import { useEffect, useState } from "react";
import { Button } from "@/components";
import { useNavigate } from "react-router-dom";
import { useFetch } from "@/CustomHooks/useFetch";
import { api } from "@/utils";
import { useUserStore } from "@/store/userStore";

type ApiResponse<T> = {
  data: T;
  meta?: any;
  status: number;
  error?: string;
  success: boolean;
};

type BackendProgram = {
  id: number;
  name: string;
  instructorId: number;
  capacity: number;
  enrolled: number;
  schedule: string;
  cohortId: number;
  classFormat: "In_Person" | "Online";
  location: string;
  meetingLink: string;
  createdAt: string;
  updatedAt: string;
  cohort: {
    id: number;
    name: string;
    startDate: string;
    status: "Upcoming" | "Ongoing" | "Completed";
    duration: string;
    applicationDeadline: string;
    program: {
      id: number;
      title: string;
      description: string;
      completed: boolean;
    };
  };
};

type ProgramView = {
  id: number;
  title: string;
  status: "in-progress" | "completed";
  cohortName: string;
  schedule: string;
  location: string;
};

const InstructorProg = () => {
  const userData = useUserStore((state) => state);
  const user_id = userData.id;
  const { data, loading, refetch } = useFetch(api.fetch.fetchInstructorPrograms, { instructorId: user_id });

  const navigate = useNavigate();
  const [programs, setPrograms] = useState<ProgramView[]>([]);
  const [filter, setFilter] = useState<"all" | "in-progress" | "completed">("in-progress");

  useEffect(() => {
    if (!data || !("data" in data)) return;

    const response = data as ApiResponse<BackendProgram[]>;
    if (!Array.isArray(response.data)) return;

    const mappedPrograms: ProgramView[] = response.data.map((item) => ({
      id: item.cohort.program.id,
      title: item.cohort.program.title,
      status: item.cohort.program.completed ? "completed" : "in-progress",
      cohortName: item.cohort.name,
      schedule: item.schedule,
      location: item.location,
    }));

    setPrograms(mappedPrograms);
  }, [data]);

  const programStatus = [
    // { id: 1, name: "All", key: "all", active: filter === "all" },
    { id: 2, name: "On-going", key: "in-progress", active: filter === "in-progress" },
    { id: 3, name: "Ended", key: "completed", active: filter === "completed" },
  ];

  const filteredPrograms = programs.filter((p) =>
    filter === "all" ? true : p.status === filter
  );

  const handleStatusSelect = (id: string | number) => {
    // map sidebar id to filter key
    if (id === 1 || id === "1") setFilter("all");
    if (id === 2 || id === "2") setFilter("in-progress");
    if (id === 3 || id === "3") setFilter("completed");
  };
  return (
    <div>
      <div className="text-xl font-semibold">
        All Program
      </div>

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
                    <h3 className="font-medium text-lg mb-2">{program.title}</h3>
                    <div className="flex gap-4 text-sm text-gray-600">
                      <span>{program.cohortName}</span>
                      <span>•</span>
                      <span>{program.schedule}</span>
                      <span>•</span>
                      <span>{program.location}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    {/* <span className="text-sm text-muted-foreground">{program.status}</span> */}
                    <Button
                      variant="secondary"
                      value="View program"
                      onClick={() => navigate(`${program.id}/cohort`)}
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
}

export default InstructorProg;