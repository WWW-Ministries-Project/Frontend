import { Modal } from "@/components/Modal";
import { useFetch } from "@/CustomHooks/useFetch";
import { usePost } from "@/CustomHooks/usePost";
import { showNotification } from "@/pages/HomePage/utils";
import { api, DetailedCourseType } from "@/utils";
import { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import { AllStudents, Student, StudentListQuery } from "../Components/AllStudents";
import { IStudentForm, StudentForm } from "../Components/StudentForm";
import { useViewPage } from "../customHooks/useViewPage";
import { createLmsActionTracker } from "../utils/lmsGuardrails";

const DEFAULT_QUERY: StudentListQuery = {
  search: "",
  status: "all",
  sortBy: "name",
  sortOrder: "asc",
  page: 1,
  take: 20,
};

export function ViewClass() {
  const { id: classId } = useParams();
  const parsedClassId = Number(classId);
  const [query, setQuery] = useState<StudentListQuery>(DEFAULT_QUERY);
  const [bulkLoading, setBulkLoading] = useState(false);

  const courseQuery = useMemo(
    () => ({
      id: classId!,
      page: query.page,
      take: query.take,
      search: query.search,
      name: query.search,
      status: query.status === "all" ? "" : query.status,
      sortBy: query.sortBy,
      sortOrder: query.sortOrder,
    }),
    [classId, query.page, query.search, query.sortBy, query.sortOrder, query.status, query.take]
  );

  // API calls
  const { data, refetch, loading: classLoading } = useFetch(
    api.fetch.fetchCourseById,
    courseQuery
  );
  const {
    postData: postStudent,
    loading: postLoading,
    data: postedData,
  } = usePost(api.post.enrollUser);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const classData = data?.data || null;
  const enrollmentPayload = classData?.enrollments as
    | Student[]
    | { data?: Student[]; meta?: { total?: number; take?: number } }
    | undefined;

  const enrollments = Array.isArray(enrollmentPayload)
    ? enrollmentPayload
    : Array.isArray(enrollmentPayload?.data)
    ? enrollmentPayload.data
    : [];

  const totalEnrollments =
    (Array.isArray(enrollmentPayload) ? undefined : enrollmentPayload?.meta?.total) ??
    data?.meta?.total ??
    classData?.enrolled ??
    enrollments.length;

  const { setLoading, setDetails, setData } = useViewPage();
  useEffect(() => {
    if (classData === null) return;
    setDetails?.(<Details classData={classData} />);
    setData?.({
      showTopic: true,
      title: classData?.name || "",
    });
    setLoading?.(false);
  }, [setDetails, classData, setData, setLoading]);

  useEffect(() => {
    if (postedData) {
      createLmsActionTracker("admin.class.enroll_student", {
        classId: classId ?? "",
      }).success();
      setIsModalOpen(false);
      refetch();
      showNotification("Student enrolled successfully", "success");
    }
    // if (postError) {
    //   showNotification(postError.message, "error");
    // }
  }, [classId, postedData, refetch]);

  const handleSubmit = (values: IStudentForm) => {
    if (!classId || Number.isNaN(parsedClassId)) return;

    createLmsActionTracker("admin.class.enroll_student.requested", {
      classId,
    }).success();
    postStudent({ user_id: values.user_id, course_id: parsedClassId });
  };

  const handleBulkAction = async (selectedRows: Student[], action: string) => {
    if (!selectedRows.length || Number.isNaN(parsedClassId)) return;

    const tracker = createLmsActionTracker("admin.class.bulk_action", {
      classId: classId ?? "",
      action,
      count: selectedRows.length,
    });

    setBulkLoading(true);
    let successCountTotal = 0;
    try {
      if (action === "unenroll") {
        const results = await Promise.allSettled(
          selectedRows.map((student) =>
            api.post.unenrollUser({
              enrollment_id: student.id,
              enrollmentId: student.id,
              user_id: student.user_id ?? student.userId,
              course_id: parsedClassId,
            })
          )
        );

        const successCount = results.filter((result) => result.status === "fulfilled").length;
        successCountTotal += successCount;
        if (successCount > 0) {
          tracker.success({ metadata: { successCount } });
          showNotification(
            `${successCount} student${successCount > 1 ? "s" : ""} unenrolled successfully.`,
            "success"
          );
        }
        if (successCount < selectedRows.length) {
          showNotification("Some unenroll requests failed. Please retry.", "error");
        }
      }

      if (action.startsWith("status_")) {
        const statusMap: Record<string, string> = {
          status_active: "ACTIVE",
          status_completed: "COMPLETED",
          status_pending: "PENDING",
        };
        const nextStatus = statusMap[action];
        if (!nextStatus) return;

        const results = await Promise.allSettled(
          selectedRows.map((student) =>
            api.put.updateEnrollment({
              enrollment_id: student.id,
              enrollmentId: student.id,
              status: nextStatus,
              course_id: parsedClassId,
            })
          )
        );

        const successCount = results.filter((result) => result.status === "fulfilled").length;
        successCountTotal += successCount;
        if (successCount > 0) {
          tracker.success({ metadata: { successCount, status: nextStatus } });
          showNotification(
            `${successCount} enrollment${successCount > 1 ? "s" : ""} updated to ${nextStatus}.`,
            "success"
          );
        }
        if (successCount < selectedRows.length) {
          showNotification("Some status updates failed. Please retry.", "error");
        }
      }

      if (successCountTotal === 0) {
        tracker.failure({ message: "No bulk actions succeeded." });
      }
      refetch();
    } catch (error) {
      tracker.failure({ error });
      showNotification("Bulk action failed. Please retry.", "error");
    } finally {
      setBulkLoading(false);
    }
  };

  return (
    <div>
      <AllStudents
        Data={enrollments}
        onOpen={() => setIsModalOpen(true)}
        query={query}
        total={totalEnrollments}
        loading={classLoading || bulkLoading}
        onQueryChange={(next) =>
          setQuery((prev) => ({
            ...prev,
            ...next,
          }))
        }
        onPageChange={(page, take) =>
          setQuery((prev) => ({
            ...prev,
            page,
            take,
          }))
        }
        onBulkAction={handleBulkAction}
      />
      <Modal
        open={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        className="!max-w-[46rem]"
      >
        <StudentForm
          onClose={() => setIsModalOpen(false)}
          onSubmit={handleSubmit}
          loading={postLoading}
        />
      </Modal>
    </div>
  );
}

const Details = ({ classData }: { classData: DetailedCourseType }) => {
  const summaryItems: { label: string; value: string }[] = [
    ...(classData?.instructor?.name
      ? [{ label: "Instructor", value: classData.instructor.name }]
      : []),
    ...(classData?.schedule ? [{ label: "Schedule", value: classData.schedule }] : []),
    ...(classData?.classFormat
      ? [{ label: "Format", value: classData.classFormat.replace("_", " ") }]
      : []),
    ...(classData?.location ? [{ label: "Location", value: classData.location }] : []),
    ...(classData?.meetingLink ? [{ label: "Meeting Link", value: classData.meetingLink }] : []),
    {
      label: "Enrollment",
      value: `${classData?.enrolled}/ ${classData?.capacity} students`,
    },
  ];

  return (
    <div className="grid w-full gap-2 sm:grid-cols-2 xl:grid-cols-3">
      {summaryItems.map((item) => (
        <div
          key={item.label}
          className="rounded-lg border border-white/20 bg-white/10 px-3 py-2"
        >
          <div className="text-xs font-semibold uppercase tracking-wide text-white/80">
            {item.label}
          </div>
          <div className="text-sm font-medium text-white break-words">
            {item.value}
          </div>
        </div>
      ))}
    </div>
  );
};
