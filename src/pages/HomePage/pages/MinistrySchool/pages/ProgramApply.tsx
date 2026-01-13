import { useMemo, useState } from "react";
import { Modal } from "@/components/Modal";
import Alert from "@/pages/Authentication/components/Alerts";
import { useFetch } from "@/CustomHooks/useFetch";
import { usePost } from "@/CustomHooks/usePost";
import { useUserStore } from "@/store/userStore";
import { api, Programs, ClassOption } from "@/utils";
import { ProgramCard } from "@/pages/MembersPage/Component/ProgramCard";
import { ProgramDetailsModal } from "@/pages/MembersPage/Component/ProgramDetailsModal";
import EmptyState from "@/components/EmptyState";
import CourseSidebar from "@/pages/MembersPage/Component/CourseSidebar";
import { Button } from "@/components";
import UsersIcon from "@/assets/sidebar/UsersIcon";
import { InformationCircleIcon, Square3Stack3DIcon, Squares2X2Icon, UserGroupIcon } from "@heroicons/react/24/outline";
import { Badge } from "@/components/Badge";

const ProgramApply = () => {
  const [open, setOpen] = useState(false);
  const [activeProgram, setActiveProgram] = useState<Programs | null>(null);
  const [selectedClassId, setSelectedClassId] = useState<string>("");

  type ProgramFilter = "all" | "member_required" | "leader_required" | "ministry_required";
  const [filter, setFilter] = useState<ProgramFilter>("all");


  const user = useUserStore();
  const { data } = useFetch(api.fetch.fetchAllApplicablePrograms);
  const programs: Programs[] | undefined = data?.data || undefined;
  const { postData: enrollUser, loading: postLoading } = usePost(api.post.enrollUser);

  const selectedClass = useMemo<ClassOption | undefined>(() => {
    return activeProgram?.courses?.find((c) => c.id === selectedClassId);
  }, [activeProgram, selectedClassId]);

  const handleOpen = (program: Programs) => {
    setActiveProgram(program);
    console.log("program", program);
    
    setSelectedClassId("");
    setOpen(true);
  };

  const handleSubmit = async () => {
  if (!activeProgram || !selectedClass) {
    Alert({
      title: "Please select a class",
      description: "Choose a class to join before applying."
    });
    return;
  }

  if (selectedClass.enrolled >= selectedClass.capacity) {
    Alert({
      title: "This class is full",
      description: "Please select a class with available seats."
    });
    return;
  }

  try {
    const res = await enrollUser({
      user_id: user.id,
      course_id: Number(selectedClassId)
    }) as { success: boolean; message: string } | undefined;

    // If backend returns something like { success: true, message: '...' }
    if (res?.success) {
     
      Alert({
        title: "Enrollment Successful",
        description: res?.message || "You have been enrolled successfully."
      });
       setOpen(false);
    } else {
      
      Alert({
        title: "Enrollment Failed",
        description: res?.message || "Something went wrong while enrolling."
      });
      setOpen(false);
    }
  } catch (err: any) {
    setOpen(false);
    Alert({
      title: "Enrollment Failed",
      description: err?.message || "An unexpected error occurred."
    });
  }
};

const programStatus = [
  { id: 1, name: "All", key: "all", active: filter === "all" },
  { id: 2, name: "Members", key: "member_required", active: filter === "member_required" },
  { id: 3, name: "Leaders", key: "leader_required", active: filter === "leader_required" },
  { id: 4, name: "Ministry Workers", key: "ministry_required", active: filter === "ministry_required" },
];

const handleStatusSelect = (id: string | number) => {
  const selected = programStatus.find((s) => s.id === Number(id));
  if (selected) {
    setFilter(selected.key as ProgramFilter);
  }
};

const filteredPrograms = useMemo(() => {
  if (!programs) return [];

  if (filter === "all") return programs;

  return programs.filter((program) => program[filter] === true);
}, [programs, filter]);

const getInitials = (name: string) =>
  name
    .split(" ")
    .filter(Boolean)
    .map((n) => n[0])
    .join("")
    .toUpperCase();

  return (
    <main className="mx-auto py-8 h-screen overflow-auto">
    <div className="flex flex-col gap-6 lg:flex-row">
      <div className="w-full lg:w-64 ">
            {/* Use CourseSidebar to render program status filters */}
            <CourseSidebar
              heading="State"
              // CourseSidebar expects navItems shaped like {id, name, active}
              navItems={programStatus.map((s) => ({ id: s.id, name: s.name, active: s.active }))}
              onSelect={handleStatusSelect}
            />
          </div>

          <div className="flex flex-col gap-4 lg:flex-1">
      {filteredPrograms && filteredPrograms.length > 0 ? (
        <div className="w-full max-w-6xl  flex flex-col gap-4">
          {filteredPrograms.map((program) => (
            <div key={program.id} className="border bg-white p-4 rounded-xl flex flex-col gap-6">
              <div className="flex flex-col gap-1">
                <div className="text-lg font-semibold">
                {program.name}
              </div>
              <div>
                <div className="mt-2 text-sm text-gray-600">
                {program.description}
              </div>
                {/* <Button value="View program details"   onClick={() => handleOpen(program)}/> */}
              </div>
              
              </div>

              

              {program?.prerequisites?.length!==0&&<div className="flex flex-col gap-1">
                <div className="text-sm font-semibold flex gap-2">
                  <Square3Stack3DIcon className="w-5"/>
                  Prerequisite
                </div>
                <div className="flex gap-6">
                  {program?.prerequisites?.map((prerequisite) => (
                    <div key={prerequisite} className="text-sm  bg-gray-100 p-1 rounded-md">
                      {prerequisite}
                    </div>
                  ))}
                </div>
              </div>}

              <div className="flex flex-col gap-1">
                <div className="text-sm font-semibold flex gap-2">
                 <UserGroupIcon className="w-5"/> Facilitators
                </div>
                <div className="flex flex-wrap gap-6 mt-1">
                  {Array.from(
                    new Set(program.courses?.map((course) => course.facilitator).filter(Boolean))
                  ).map((facilitator) => (
                    <div key={facilitator} className="text-sm flex gap-2 items-center">
                      <div className="rounded-full bg-gray-100 px-2 py-1 font-medium">
                        {getInitials(facilitator)}
                      </div>
                      <div className="font-medium">{facilitator}</div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex flex-col gap-1">
                <div className="text-sm font-semibold flex gap-2">
                 <Squares2X2Icon className="w-5"/> Cohort
                </div>
                <div className="flex gap-6 mt-1">
                  
                  <div className="text-sm flex gap-2 items-center">
                    <div className="font-medium">
                      {program.upcomingCohort}
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex flex-col gap-1">
                <div className="text-sm ">
                 <div className="font-semibold flex gap-2 items-center"><Squares2X2Icon className="w-5"/> Target group</div>
                </div>
                <div className="flex gap-6 mt-1">
                  <div className="text-sm flex flex-col gap-2 ">
                    <div>This program is structured for people who are or want to be: </div>
                    <div className="font-medium flex gap-2">
                      {program.leader_required && <Badge>Leaders</Badge>}
                      {program.ministry_required && <Badge>Ministry workers</Badge>}
                      {program.member_required && <Badge>Church members</Badge>}
                    </div>
                  </div>
                </div>
              </div>
              <hr />
              <div className="flex justify-end">
                <Button value="View program details"   onClick={() => handleOpen(program)}/>
              </div>
            </div>
            // <ProgramCard key={program.id} program={program} onOpen={() => handleOpen(program)} />
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-12 text-gray-500">
          <EmptyState/>
          <h2 className="mb-2 text-2xl font-bold">No Programs Available</h2>
          We will be adding more programs soon.
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
          submitting={postLoading}
        />
      </Modal>
    </main>
  );
};

export default ProgramApply;