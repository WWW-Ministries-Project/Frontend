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

const ProgramApply = () => {
  const [open, setOpen] = useState(false);
  const [activeProgram, setActiveProgram] = useState<Programs | null>(null);
  const [selectedClassId, setSelectedClassId] = useState<string>("");

  const user = useUserStore();
  const { data } = useFetch(api.fetch.fetchAllApplicablePrograms);
  const programs: Programs[] | undefined = data?.data || undefined;
  const { postData: enrollUser, loading: postLoading } = usePost(api.post.enrollUser);

  const selectedClass = useMemo<ClassOption | undefined>(() => {
    return activeProgram?.courses?.find((c) => c.id === selectedClassId);
  }, [activeProgram, selectedClassId]);

  const handleOpen = (program: Programs) => {
    setActiveProgram(program);
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
    });

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

  return (
    <div className="w-full py-4 flex flex-col overflow-auto">
      {programs && programs.length > 0 ? (
        <div className="grid w-full max-w-6xl grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {programs.map((program) => (
            <ProgramCard key={program.id} program={program} onOpen={() => handleOpen(program)} />
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-12 text-gray-500">
          <EmptyState/>
          <h2 className="mb-2 text-2xl font-bold">No Programs Available</h2>
          We will be adding more programs soon.
        </div>
      )}

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
    </div>
  );
};

export default ProgramApply;