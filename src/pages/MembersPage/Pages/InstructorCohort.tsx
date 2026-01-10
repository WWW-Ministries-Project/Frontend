import { Button } from "@/components";
import BannerWrapper from "../layouts/BannerWrapper";
import { useNavigate, useParams } from "react-router-dom";
import { api, relativePath } from "@/utils";
import CourseSidebar from "../Component/CourseSidebar";
import { useEffect, useState } from "react";
import { useFetch } from "@/CustomHooks/useFetch";
import { Badge } from "@/components/Badge";


type ApiResponse<T> = {
  data: T;
  message?: string;
};

type BackendCohort = {
  id: number;
  name: string;
  startDate: string;
  status: "Upcoming" | "Ongoing" | "Completed";
  description: string;
  duration: string;
  applicationDeadline: string;
  programId: number;
  createdAt: string;
  updatedAt: string;
};

type CohortView = {
  id: number;
  name: string;
  status: "Upcoming" | "Ongoing" | "Completed";
  startDate: string;
  duration: string;
};

const InstructorCohort = () => {
    const navigate = useNavigate();
    const { programId } = useParams<{ programId: string }>();

  const { data, loading, refetch } = useFetch(
  api.fetch.fetchCohortsByProgram, { programId: programId!} 
);
  
    const [cohorts, setCohorts] = useState<CohortView[]>([]);
    const [filter, setFilter] = useState<"all" | "active" | "completed">("active");

    useEffect(() => {
      if (!data || !("data" in data)) return;

      const response = data as ApiResponse<BackendCohort[]>;
      if (!Array.isArray(response.data)) return;

      const mapped: CohortView[] = response.data.map((item) => ({
        id: item.id,
        name: item.name,
        status: item.status,
        startDate: item.startDate,
        duration: item.duration,
      }));

      setCohorts(mapped);
    }, [data]);

    const programStatus = [
      // { id: 1, name: "All", key: "all", active: filter === "all" },
      { id: 2, name: "Active", key: "active", active: filter === "active" },
      { id: 3, name: "Ended", key: "completed", active: filter === "completed" },
    ];

  const filteredCohorts = cohorts.filter((c) => {
    if (filter === "all") return true;
    if (filter === "completed") return c.status === "Completed";
    // active = Upcoming + Ongoing
    return c.status === "Upcoming" || c.status === "Ongoing";
  });

    const handleStatusSelect = (id: string | number) => {
      const selected = programStatus.find((s) => s.id === Number(id));
      if (!selected) return;
      setFilter(selected.key as typeof filter);
    };
    return ( 
        <div>
            <div className="text-xl font-semibold">
              All Cohort
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
            {filteredCohorts.length === 0 ? (
              <div className="rounded-xl border border-gray-300 p-6 bg-white">
                No cohorts match the selected state.
              </div>
            ) : (
              filteredCohorts.map((cohort) => (
                <div
                  key={cohort.id}
                  className="flex  items-center border border-gray-300 rounded-xl justify-between p-4 w-full bg-white"
                >
                  <div className="flex flex-col gap-y-2">
                    <div className="flex items-center gap-x-2">
                      <h3 className="font-medium text-lg">{cohort.name}</h3>
                      <Badge>{cohort.status}</Badge>
                    </div>
                    <div className="flex gap-4 text-sm text-gray-600">
                      <span>Starts: {new Date(cohort.startDate).toLocaleDateString()}</span>
                      <span>•</span>
                      <span>{cohort.duration}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Button
                      variant="secondary"
                      value="View details"
                      onClick={() => navigate(`${cohort.id}`)}
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
 
export default InstructorCohort;