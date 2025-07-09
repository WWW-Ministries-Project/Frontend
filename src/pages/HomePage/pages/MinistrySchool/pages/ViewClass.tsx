import { Modal } from "@/components/Modal";
import { useFetch } from "@/CustomHooks/useFetch";
import { usePost } from "@/CustomHooks/usePost";
import { showNotification } from "@/pages/HomePage/utils";
import { api } from "@/utils";
import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import AllStudents from "../Components/AllStudents";
import { IStudentForm, StudentForm } from "../Components/StudentForm";
import { useViewPage } from "../customHooks/ViewPageContext";

export function ViewClass() {
  const { id: classId } = useParams();
  // API calls
  const { data, refetch } = useFetch(api.fetch.fetchCourseById, {
    id: classId!,
  });
  const {
    postData: postStudent,
    loading: postLoading,
    data: postedData,
    error: postError,
  } = usePost(api.post.enrollUser);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const classData = data?.data || null;

  const { setLoading, setDetails, setData } = useViewPage();
  useEffect(() => {
    setDetails?.(
      <div className="flex  gap-x-12 gap-y-4 grid grid-cols-3 w-1/2">
        {classData?.instructor && (
          <div>
            <div className="font-semibold text-small">Instructor</div>
            <div>{classData?.instructor.name}</div>
          </div>
        )}
        {classData?.schedule && (
          <div>
            <div className="font-semibold text-small">Schedule</div>
            <div>{classData?.schedule}</div>
          </div>
        )}
        {classData?.classFormat && (
          <div>
            <div className="font-semibold text-small">Format</div>
            <div>{classData?.classFormat}</div>
          </div>
        )}
        {classData?.location && (
          <div>
            <div className="font-semibold text-small">Location</div>
            <div>{classData?.location} </div>
          </div>
        )}
        {classData?.meetingLink && (
          <div>
            <div className="font-semibold text-small">MeetingLink</div>
            <div>{classData?.meetingLink} </div>
          </div>
        )}
        {
          <div>
            <div className="font-semibold text-small">Enrollment</div>
            <div>
              {classData?.enrolled}/ {classData?.capacity} students
            </div>
          </div>
        }
      </div>
    );
    setData?.({
      showTopic: true,
      title: classData?.name || "",
    });
    setLoading?.(false);
  }, [setDetails, classData, setData, setLoading]);

  useEffect(() => {
    if (postedData) {
      setIsModalOpen(false);
      refetch();
      showNotification("Student enrolled successfully", "success");
    }
    if (postError) {
      showNotification(postError.message, "error");
    }
  }, [postedData, refetch, postError]);

  const handleSubmit = (values: IStudentForm) => {
    if (!classId || isNaN(parseInt(classId, 10))) return;

    postStudent({ user_id: values.user_id, course_id: Number(classId) });
  };

  return (
    <div className="px-4">
      <div>
        <AllStudents
          Data={data?.data?.enrollments || []}
          onOpen={() => setIsModalOpen(true)}
        />
      </div>
      <Modal open={isModalOpen} onClose={() => setIsModalOpen(false)}>
        <StudentForm
          onClose={() => setIsModalOpen(false)}
          onSubmit={handleSubmit}
          loading={postLoading}
        />
      </Modal>
    </div>
  );
}
