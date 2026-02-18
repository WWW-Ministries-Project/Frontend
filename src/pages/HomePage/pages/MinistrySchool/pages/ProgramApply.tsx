import EmptyState from "@/components/EmptyState";
import { Modal } from "@/components/Modal";
import { Button } from "@/components";
import { useFetch } from "@/CustomHooks/useFetch";
import { ProgramDetailsModal } from "@/pages/MembersPage/Component/ProgramDetailsModal";
import CourseSidebar from "@/pages/MembersPage/Component/CourseSidebar";
import { showNotification } from "@/pages/HomePage/utils";
import { useUserStore } from "@/store/userStore";
import { api, ClassOption, Programs } from "@/utils";
import { ApiCreationCalls } from "@/utils/api/apiPost";
import { Badge } from "@/components/Badge";
import {
  Squares2X2Icon,
  Square3Stack3DIcon,
  UserGroupIcon,
} from "@heroicons/react/24/outline";
import { useMemo, useState } from "react";

type ProgramFilter = "all" | "member_required" | "leader_required" | "ministry_required";

const ProgramApply = () => {
  const [open, setOpen] = useState(false);
  const [activeProgram, setActiveProgram] = useState<Programs | null>(null);
  const [selectedClassId, setSelectedClassId] = useState<string>("");
  const [filter, setFilter] = useState<ProgramFilter>("all");
  const [submitting, setSubmitting] = useState(false);

  const apiPost = useMemo(() => new ApiCreationCalls(), []);
  const user = useUserStore();
  const { data, loading, refetch } = useFetch(api.fetch.fetchAllApplicablePrograms);
  const programs = useMemo<Programs[]>(() => data?.data ?? [], [data?.data]);

  const selectedClass = useMemo<ClassOption | undefined>(() => {
    return activeProgram?.courses?.find((course) => course.id === selectedClassId);
  }, [activeProgram, selectedClassId]);

  const programStatus = [
    { id: 1, name: "All", key: "all", active: filter === "all" },
    { id: 2, name: "Members", key: "member_required", active: filter === "member_required" },
    { id: 3, name: "Leaders", key: "leader_required", active: filter === "leader_required" },
    { id: 4, name: "Ministry Workers", key: "ministry_required", active: filter === "ministry_required" },
  ];

  const filteredPrograms = useMemo(() => {
    if (filter === "all") return programs;
    return programs.filter((program) => program[filter] === true);
  }, [programs, filter]);

  const getInitials = (name: string) =>
    name
      .split(" ")
      .filter(Boolean)
      .map((part) => part[0])
      .join("")
      .toUpperCase();

  const handleOpen = (program: Programs) => {
    setActiveProgram(program);
    setSelectedClassId("");
    setOpen(true);
  };

  const handleStatusSelect = (id: string | number) => {
    const selected = programStatus.find((state) => state.id === Number(id));
    if (selected) setFilter(selected.key as ProgramFilter);
  };

  const handleSubmit = async () => {
    if (!activeProgram || !selectedClass) {
      showNotification("Please select a class to continue.", "error");
      return;
    }

    if (!user.id) {
      showNotification("Unable to identify your profile. Please sign in again.", "error");
      return;
    }

    if (selectedClass.enrolled >= selectedClass.capacity) {
      showNotification("This class is full. Please choose another class.", "error");
      return;
    }

    setSubmitting(true);
    try {
      const response = await apiPost.enrollUser({
        user_id: user.id,
        course_id: Number(selectedClassId),
      });

      if ((response as { success?: boolean; message?: string })?.success) {
        showNotification(
          (response as { message?: string }).message || "Enrollment successful.",
          "success"
        );
        setOpen(false);
        refetch();
      } else {
        showNotification(
          (response as { message?: string }).message || "Enrollment failed. Please try again.",
          "error"
        );
      }
    } catch {
      showNotification("An unexpected error occurred while enrolling.", "error");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className="mx-auto min-h-screen py-8">
      <div className="flex flex-col gap-6 lg:flex-row">
        <div className="w-full lg:w-64">
          <CourseSidebar
            heading="Category"
            navItems={programStatus.map((state) => ({
              id: state.id,
              name: state.name,
              active: state.active,
            }))}
            onSelect={handleStatusSelect}
          />
        </div>

        <div className="flex flex-1 flex-col gap-4">
          {loading ? (
            <div className="space-y-3">
              {Array.from({ length: 3 }).map((_, index) => (
                <div key={index} className="animate-pulse rounded-xl border border-lightGray bg-white p-4">
                  <div className="mb-4 h-5 w-1/3 rounded bg-lightGray" />
                  <div className="mb-2 h-3 w-full rounded bg-lightGray/80" />
                  <div className="h-3 w-5/6 rounded bg-lightGray/70" />
                </div>
              ))}
            </div>
          ) : filteredPrograms.length > 0 ? (
            filteredPrograms.map((program) => (
              <article
                key={program.id}
                className="rounded-xl border border-lightGray bg-white p-4 shadow-sm"
              >
                <header className="space-y-1">
                  <h2 className="text-lg font-semibold text-primary">{program.name}</h2>
                  <p className="text-sm text-primaryGray">{program.description}</p>
                </header>

                {!!program?.prerequisites?.length && (
                  <section className="mt-4 space-y-2">
                    <p className="flex items-center gap-2 text-sm font-semibold text-primary">
                      <Square3Stack3DIcon className="w-5" />
                      Prerequisites
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {program.prerequisites.map((prerequisite) => (
                        <span
                          key={prerequisite}
                          className="rounded-md bg-lightGray/30 px-2 py-1 text-sm text-primary"
                        >
                          {prerequisite}
                        </span>
                      ))}
                    </div>
                  </section>
                )}

                <section className="mt-4 space-y-2">
                  <p className="flex items-center gap-2 text-sm font-semibold text-primary">
                    <UserGroupIcon className="w-5" />
                    Facilitators
                  </p>
                  <div className="flex flex-wrap gap-3">
                    {Array.from(
                      new Set(program.courses?.map((course) => course.facilitator).filter(Boolean))
                      ).map((facilitator) => (
                        <div key={facilitator} className="flex items-center gap-2 text-sm">
                          <span className="rounded-full bg-lightGray/30 px-2 py-1 font-medium text-primary">
                            {getInitials(facilitator)}
                          </span>
                        <span className="font-medium text-primary">{facilitator}</span>
                      </div>
                    ))}
                  </div>
                </section>

                <section className="mt-4 space-y-2">
                  <p className="flex items-center gap-2 text-sm font-semibold text-primary">
                    <Squares2X2Icon className="w-5" />
                    Cohort
                  </p>
                  <p className="text-sm text-primaryGray">{program.upcomingCohort || "Not assigned"}</p>
                </section>

                <section className="mt-4 space-y-2">
                  <p className="flex items-center gap-2 text-sm font-semibold text-primary">
                    <Squares2X2Icon className="w-5" />
                    Target Group
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {program.leader_required && <Badge>Leaders</Badge>}
                    {program.ministry_required && <Badge>Ministry workers</Badge>}
                    {program.member_required && <Badge>Church members</Badge>}
                  </div>
                </section>

                <div className="mt-5 flex justify-end border-t border-lightGray pt-4">
                  <Button value="View program details" onClick={() => handleOpen(program)} />
                </div>
              </article>
            ))
          ) : (
            <div className="rounded-xl border border-lightGray bg-white p-6 text-center">
              <EmptyState />
              <h2 className="mb-2 text-2xl font-bold text-primary">No Programs Available</h2>
              <p className="text-sm text-primaryGray">Programs will appear here once they are published.</p>
            </div>
          )}
        </div>
      </div>

      <Modal open={open} persist onClose={() => setOpen(false)}>
        <ProgramDetailsModal
          program={activeProgram}
          selectedClassId={selectedClassId}
          onSelectClass={setSelectedClassId}
          onClose={() => setOpen(false)}
          onSubmit={handleSubmit}
          submitting={submitting}
        />
      </Modal>
    </main>
  );
};

export default ProgramApply;
