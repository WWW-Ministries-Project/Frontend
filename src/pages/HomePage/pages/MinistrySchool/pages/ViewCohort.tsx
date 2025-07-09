import { Button } from "@/components/Button";
import EmptyState from "@/components/EmptyState";
import { Modal } from "@/components/Modal";
import { useDelete } from "@/CustomHooks/useDelete";
import { useFetch } from "@/CustomHooks/useFetch";
import { usePost } from "@/CustomHooks/usePost";
import { usePut } from "@/CustomHooks/usePut";
import { showDeleteDialog } from "@/pages/HomePage/utils";
import { api } from "@/utils";
import { formatDate } from "@/utils/helperFunctions";
import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { ClassCard, ClassItemType } from "../Components/ClassCard";
import { ClassForm, IClassForm } from "../Components/ClassForm";
import { useViewPage } from "../customHooks/ViewPageContext";

export const ViewCohort = () => {
  const { id: cohortId } = useParams();
  //api calls
  const { data, refetch } = useFetch(api.fetch.fetchCohortById, {
    id: cohortId!,
  });
  const {
    postData: postClass,
    loading: postLoading,
    data: postedData,
  } = usePost(api.post.createCourse);
  const {
    updateData: updateClass,
    loading: updateLoading,
    data: updatedData,
  } = usePut(api.put.updateClass);
  const { executeDelete, success } = useDelete(api.delete.deleteCourse);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedClass, setSelectedClass] = useState<IClassForm | undefined>(
    undefined
  );
  const cohortData = data?.data || null;

  const { setLoading, setDetails, setData } = useViewPage();
  useEffect(() => {
    setDetails?.(
      <div className="flex gap-8">
        <div>
          <div className="font-semibold text-small">Start date</div>
          <div>{formatDate(cohortData?.startDate || "")}</div>
        </div>
        <div>
          <div className="font-semibold text-small">Duration</div>
          <div>{cohortData?.duration}</div>
        </div>
        <div>
          <div className="font-semibold text-small">Application Deadline</div>
          <div>{formatDate(cohortData?.applicationDeadline || "")}</div>
        </div>
        <div>
          <div className="font-semibold text-small">Classes</div>
          <div>{cohortData?.courses?.length} classes</div>
        </div>
      </div>
    );
    setData?.({
      showTopic: true,
      title: cohortData?.name || "",
      description: cohortData?.description,
    });
    setLoading?.(false);
  }, [setDetails, cohortData, setData, setLoading]);

  useEffect(() => {
    if (success || postedData || updatedData) {
      setIsModalOpen(false);
      refetch();
    }
  }, [success, refetch, updatedData, postedData]);
  const handleSubmit = (values: IClassForm) => {
    if (!cohortId || isNaN(parseInt(cohortId, 10))) return;
    if (selectedClass?.id) {
      updateClass(
        {
          ...values,
          id: Number(selectedClass.id),
          // cohortId: Number(cohortId),
        },
        { id: String(selectedClass.id) }
      );
    } else {
      postClass({ ...values, cohortId: Number(cohortId) });
    }
  };
  const handleEdit = (course: ClassItemType): void => {
    const initialData: IClassForm = {
      id: course.id,
      name: course.name,
      capacity: course.capacity,
      schedule: course.schedule,
      classFormat: course.classFormat,
      location: course.location,
      meetingLink: course.meetingLink,
      instructorId: course.instructor.id + "",
    };
    setSelectedClass(initialData);
    setIsModalOpen(true);
  };

  const deleteClass = async ({ id, name }: { id: number; name: string }) => {
    showDeleteDialog({ name, id }, () => executeDelete({ id: String(id) }));
  };

  return (
    <>
      <section>
        <div className=" rounded-lg py-4 space-y-2">
          {/* Classes */}
          <div className="flex justify-between items-center">
            <div className="">
              <h1 className="text-dark900 text-2xl font-bold">Class</h1>
            </div>
            <Button
              value="Add Class"
              className="p-2 m-1 text-white min-h-10 max-h-14 bg-primary"
              onClick={() => setIsModalOpen(true)}
            />
          </div>

          {cohortData?.courses.length === 0 ? (
            <EmptyState msg={"No class found"} />
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 ">
              {cohortData?.courses.map((classItem) => (
                <div key={classItem.id + classItem.name}>
                  <ClassCard
                    classItem={classItem}
                    onEdit={handleEdit}
                    onDelete={() => deleteClass(classItem)}
                  />
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      <Modal open={isModalOpen} onClose={() => setIsModalOpen(false)}>
        <ClassForm
          onClose={() => setIsModalOpen(false)}
          loading={postLoading || updateLoading}
          initialData={selectedClass}
          onSubmit={handleSubmit}
        />
      </Modal>
    </>
  );
};
