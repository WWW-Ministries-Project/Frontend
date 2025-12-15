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
import { Square3Stack3DIcon, Squares2X2Icon, UserGroupIcon } from "@heroicons/react/24/outline";

const ProgramApply = () => {
  const [open, setOpen] = useState(false);
  const [activeProgram, setActiveProgram] = useState<Programs | null>(null);
  const [selectedClassId, setSelectedClassId] = useState<string>("");
  const [filter, setFilter] = useState<"all" | "church_members" | "ministry_workers" | "HOD">("all");


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
    { id: 2, name: "Church members", key: "church_members", active: filter === "church_members" },
    { id: 3, name: "Ministry workers", key: "ministry_workers", active: filter === "ministry_workers" },
    { id: 4, name: "Heads of Ministries & Departments", key: "HOD", active: filter === "HOD" },
  ];
  const handleStatusSelect = (id: string | number) => {
    // map sidebar id to filter key
    if (id === 1 || id === "1") setFilter("all");
    if (id === 2 || id === "2") setFilter("church_members");
    if (id === 3 || id === "3") setFilter("ministry_workers");
    if (id === 4 || id === "4") setFilter("HOD");
  };

  return (
    <main className="mx-auto py-8 ">
    <div className="flex flex-col gap-6 lg:flex-row">
      <div className="w-full lg:w-64 lg:sticky lg:top-6">
            {/* Use CourseSidebar to render program status filters */}
            <CourseSidebar
              heading="State"
              // CourseSidebar expects navItems shaped like {id, name, active}
              navItems={programStatus.map((s) => ({ id: s.id, name: s.name, active: s.active }))}
              onSelect={handleStatusSelect}
            />
          </div>

          <div className="flex flex-col gap-4 lg:flex-1">
      {programs && programs.length > 0 ? (
        <div className="w-full max-w-6xl  flex flex-col gap-4">
          {programs.map((program) => (
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
                <div className="flex gap-6 mt-1">
                  <div className="text-sm flex gap-2 items-center">
                    <div className="rounded-full bg-gray-100 p-1">JA</div>
                    <div className="font-medium">
                      John Appleseed
                    </div>
                  </div>
                  <div className="text-sm flex gap-2 items-center">
                    <div className="rounded-full bg-gray-100 p-1">JA</div>
                    <div className="font-medium">
                      John Appleseed
                    </div>
                  </div>
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