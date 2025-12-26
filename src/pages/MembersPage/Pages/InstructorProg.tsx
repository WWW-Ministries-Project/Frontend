import { dummyProgData } from "@/pages/HomePage/utils/dummyProgData";
import CourseSidebar from "../Component/CourseSidebar";
import BannerWrapper from "../layouts/BannerWrapper";
import { useEffect, useState } from "react";
import { Button } from "@/components";
import { useNavigate } from "react-router-dom";

type Program = typeof dummyProgData[number];

const InstructorProg = () => {

    const navigate = useNavigate();
    const [programs, setPrograms] = useState<Program[]>([]);
      const [filter, setFilter] = useState<"all" | "in-progress" | "completed">("in-progress");

      useEffect(() => {
          // load dummy data (sync)
          setPrograms(dummyProgData as Program[]);
        }, []);

    const programStatus = [
    // { id: 1, name: "All", key: "all", active: filter === "all" },
    { id: 2, name: "On-going", key: "in-progress", active: filter === "in-progress" },
    { id: 3, name: "Ended", key: "completed", active: filter === "completed" },
  ];

  const filteredPrograms = programs.filter((p) => (filter === "all" ? true : p.status === filter));

     const handleStatusSelect = (id: string | number) => {
    // map sidebar id to filter key
    if (id === 1 || id === "1") setFilter("all");
    if (id === 2 || id === "2") setFilter("in-progress");
    if (id === 3 || id === "3") setFilter("completed");
  };
    return ( 
        <div>
            <BannerWrapper>
          <div className="space-y-4">
            <div className="font-bold text-3xl">Instructor Portal</div>
            <div>Overview of programs you are instructing.</div>
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
                              <h3 className="font-medium text-lg mb-2">{program.title}</h3>
                              <div className="flex gap-4 text-sm">
                                
                              </div>
                            </div>
          
                            <div className="flex items-center gap-3">
                              {/* <span className="text-sm text-muted-foreground">{program.status}</span> */}
                              <Button
                                variant="secondary"
                                value="View program"
                                onClick={() => navigate(String(program.id))}
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