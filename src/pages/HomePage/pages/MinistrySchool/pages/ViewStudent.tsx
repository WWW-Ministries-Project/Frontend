import { Button } from "@/components";
import { Badge } from "@/components/Badge";
import { useFetch } from "@/CustomHooks/useFetch";
import { usePut } from "@/CustomHooks/usePut";
import { showNotification } from "@/pages/HomePage/utils";
import { api } from "@/utils";
import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { TopicAssessment } from "../Components/TopicAssessment";
import { useViewPage } from "../customHooks/ViewPageContext";

const ViewStudent = () => {
  const { id: studentId } = useParams();
  // api
  const { data: studentData, refetch } = useFetch(api.fetch.fetchStudentById, {
    id: studentId!,
  });
  const {
    updateData,
    loading,
    error,
    data: updatedData,
  } = usePut(api.put.updateStudentProgress);
  const [editMode, setEditMode] = useState(false);
  const topics = studentData?.data.course?.cohort?.program?.topics;

  const { setLoading, setDetails, setData } = useViewPage();
  useEffect(() => {
    if (!studentData?.data) return;
    setDetails?.(<Details data={studentData?.data} onEdit={toggleEditMode} />);
    setData?.({
      showTopic: true,
      // title: classData?.name || "",
    });
    setLoading?.(false);
  }, [setDetails, setData, setLoading, studentData?.data]);

  useEffect(() => {
      if (updatedData) {
        showNotification("Progress updated successfully", "success");
        setEditMode(false);
        refetch();
      }
    if (error) showNotification("Error updating progress", "error");
  }, [refetch, updatedData, error]);

  const toggleEditMode = () => {
    setEditMode((prevMode) => !prevMode);
  };

  return (
    <div className="">
      {studentData?.data.id && (
        <TopicAssessment
          topics={topics || []}
          editMode={editMode}
          enrollmentId={studentData?.data.id}
          onCancel={() => setEditMode(false)}
          onUpdate={(data) => updateData(data)}
          loading={loading}
        />
      )}
    </div>
  );
};

export default ViewStudent;

const Details = ({
  data,
  onEdit,
}: {
  data: { email: string; phone: string };
  onEdit: () => void;
}) => {
  return (
    <div className="flex flex-wrap gap-x-12 w-full">
      <div className="space-y-1">
        <div className="font-semibold ">Membership</div>
        <Badge>Member</Badge>{" "}
      </div>
      <div className="space-y-1">
        <div className="font-semibold ">Email</div>
        <div className="">{data?.email} </div>
      </div>
      <div className="space-y-1">
        <div className="font-semibold">Phone number</div>
        <div>{data?.phone} </div>
      </div>
      <div className="ml-auto">
        <Button variant="primary" value="Edit" onClick={onEdit} />
      </div>
    </div>
  );
};
