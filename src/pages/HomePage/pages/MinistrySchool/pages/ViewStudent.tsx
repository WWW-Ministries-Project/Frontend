import { useFetch } from "@/CustomHooks/useFetch";
import { usePut } from "@/CustomHooks/usePut";
import { showNotification } from "@/pages/HomePage/utils";
import { api, EnrollmentDataType, User } from "@/utils";
import { useEffect, useState } from "react";
import { useLocation, useParams } from "react-router-dom";
import { TopicAssessment } from "../Components/TopicAssessment";
import { useViewPage } from "../customHooks/useViewPage";

interface StudentDetailsState {
  studentDetails?: {
    name?: string;
    email?: string;
    phone?: string;
  };
}

const ViewStudent = () => {
  const { id: studentId } = useParams();
  const location = useLocation();
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
  const topics = studentData?.data.topics;
  const routeStudentDetails = (location.state as StudentDetailsState | null)
    ?.studentDetails;

  const { setLoading, setDetails, setData } = useViewPage();
  useEffect(() => {
    const displayName = resolveStudentName(
      studentData?.data,
      routeStudentDetails?.name
    );
    setDetails?.(
      <Details
        data={studentData?.data}
        fallbackEmail={routeStudentDetails?.email}
        fallbackPhone={routeStudentDetails?.phone}
        fallbackName={routeStudentDetails?.name}
      />
    );
    setData?.({
      showTopic: true,
      title: displayName,
      user: studentData?.data?.user,
    });
    setLoading?.(false);
  }, [
    setDetails,
    setData,
    setLoading,
    studentData?.data,
    routeStudentDetails?.name,
    routeStudentDetails?.email,
    routeStudentDetails?.phone,
  ]);

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
    <div className="pt-2">
      {studentData?.data.id && (
        <div className="rounded-xl border border-lightGray bg-white p-4 md:p-6">
          <TopicAssessment
            topics={topics || []}
            editMode={editMode}
            enrollmentId={studentData?.data.id}
            onCancel={() => setEditMode(false)}
            toggleEditMode={toggleEditMode}
            onUpdate={(data) => updateData(data)}
            loading={loading}
            studentData={studentData?.data}
          />
        </div>
      )}
    </div>
  );
};

export default ViewStudent;

const Details = ({
  data,
  fallbackName,
  fallbackEmail,
  fallbackPhone,
}: {
  data?: EnrollmentDataLike | null;
  fallbackName?: string;
  fallbackEmail?: string;
  fallbackPhone?: string;
}) => {
  const displayName = resolveStudentName(data, fallbackName);
  const displayEmail = resolveStudentEmail(data, fallbackEmail);
  const displayPhone = resolveStudentPhone(data, fallbackPhone);

  return (
    <div className="grid w-full gap-2 sm:grid-cols-2 xl:grid-cols-3">
      <InfoCard label="Name" value={displayName} />
      <InfoCard label="Email" value={displayEmail} breakMode="break-all" />
      <InfoCard label="Phone number" value={displayPhone} breakMode="break-all" />
    </div>
  );
};

const InfoCard = ({
  label,
  value,
  breakMode = "break-words",
}: {
  label: string;
  value: string;
  breakMode?: string;
}) => {
  return (
    <div className="rounded-lg border border-white/20 bg-white/10 px-3 py-2">
      <div className="text-xs font-semibold uppercase tracking-wide text-white/80">
        {label}
      </div>
      <div className={`text-sm font-medium text-white ${breakMode}`}>
        {value || "-"}
      </div>
    </div>
  );
};

type EnrollmentDataLike = EnrollmentDataType & {
  user?: (User & {
    first_name?: string;
    last_name?: string;
    other_name?: string;
    primary_number?: string;
    country_code?: string;
    phone?: string;
  }) | null;
  first_name?: string;
  last_name?: string;
  primary_number?: string;
  country_code?: string;
};

const trimValue = (value?: string | null): string => (value ?? "").trim();

const buildFullName = (
  firstName?: string | null,
  lastName?: string | null
): string =>
  [trimValue(firstName), trimValue(lastName)].filter(Boolean).join(" ").trim();

const buildPhone = (
  countryCode?: string | null,
  number?: string | null
): string => {
  const cc = trimValue(countryCode);
  const num = trimValue(number);
  return [cc, num].filter(Boolean).join(" ").trim();
};

const resolveStudentName = (
  data?: EnrollmentDataLike | null,
  fallbackName?: string
): string => {
  const fallback = trimValue(fallbackName);
  if (fallback) return fallback;
  if (!data) return "Student";

  const nameFromUser = trimValue(data.user?.name);
  if (nameFromUser) return nameFromUser;

  const nestedFirstLast = buildFullName(data.user?.first_name, data.user?.last_name);
  if (nestedFirstLast) return nestedFirstLast;

  const rootFirstLast = buildFullName(data.first_name, data.last_name);
  if (rootFirstLast) return rootFirstLast;

  return "Student";
};

const resolveStudentEmail = (
  data?: EnrollmentDataLike | null,
  fallbackEmail?: string
): string => {
  const fallback = trimValue(fallbackEmail);
  if (fallback) return fallback;
  if (!data) return "-";
  return trimValue(data.email) || trimValue(data.user?.email) || "-";
};

const resolveStudentPhone = (
  data?: EnrollmentDataLike | null,
  fallbackPhone?: string
): string => {
  const fallback = trimValue(fallbackPhone);
  if (fallback) return fallback;
  if (!data) return "-";

  const nestedPhone = buildPhone(
    data.user?.user_info?.country_code,
    data.user?.user_info?.primary_number
  );
  if (nestedPhone) return nestedPhone;

  const flattenedUserPhone = buildPhone(data.user?.country_code, data.user?.primary_number);
  if (flattenedUserPhone) return flattenedUserPhone;

  const flattenedEnrollmentPhone = buildPhone(data.country_code, data.primary_number);
  if (flattenedEnrollmentPhone) return flattenedEnrollmentPhone;

  return trimValue(data.phone) || trimValue(data.user?.phone) || "-";
};
