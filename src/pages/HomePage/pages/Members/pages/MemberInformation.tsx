import { ReactNode, isValidElement, useState } from "react";
import TabSelection from "@/pages/HomePage/Components/reusable/TabSelection";
import { formatDate, formatPhoneNumber } from "@/utils";
import {
  UserIcon,
  PhoneIcon,
  BuildingLibraryIcon,
  BriefcaseIcon,
  UsersIcon,
  AcademicCapIcon,
} from "@heroicons/react/24/outline";

import { useOutletContext } from "react-router-dom";
import { FamilyInformation } from "./FamilyInformation";

//TODO: TAKE A SECOND LOOK AT INFOFIELD AND SECTION
//TODO: FIND A BETTER STRUCTURE FOR TYPING DATA FROM BE
const normalizeMemberStatus = (
  status?: string | null
): "UNCONFIRMED" | "CONFIRMED" | "MEMBER" => {
  const normalized = (status || "").toUpperCase().trim();

  if (normalized === "CONFIRMED") return "CONFIRMED";
  if (normalized === "MEMBER") return "MEMBER";

  return "UNCONFIRMED";
};

const formatMemberStatus = (status?: string | null): string => {
  const normalizedStatus = normalizeMemberStatus(status);

  if (normalizedStatus === "MEMBER") return "Functional Member";
  if (normalizedStatus === "CONFIRMED") return "Confirmed Member";

  return "Unconfirmed Member";
};

const toTitleCase = (value?: string | null): string => {
  if (!value) return "-";

  return value
    .replace(/_/g, " ")
    .toLowerCase()
    .replace(/\b\w/g, (char) => char.toUpperCase());
};

export function MemberInformation() {
  const { details: user, loading } = useOutletContext<{
    details?: IMemberInfo;
    loading?: boolean;
  }>();

  const [selectedTab, setSelectedTab] = useState("Basic Information");

  if (!user) {
    return (
      <div className="bg-white rounded-b-lg p-6 text-gray-700">
        {loading ? "Loading member information..." : "Member information unavailable."}
      </div>
    );
  }

  const handleTabSelect = (tab: string) => {
    setSelectedTab(tab);
  };

  // Derive membership status for display
  const membershipType =
    user.membership_type === "ONLINE"
      ? "Online e-church family"
      : user.membership_type === "IN_HOUSE"? "In-person church family" :"";
  const membershipStatus = formatMemberStatus(user.status);
  const enrolledProgramsSummary = user.enrolled_programs?.summary;
  const enrolledPrograms = user.enrolled_programs?.items || [];

  return (
    <div className="bg-white rounded-b-lg  p-6 pt-0 mx-auto text-gray-800 ">
      <TabSelection
        tabs={[
          "Basic Information",
          "Contact Information",
          "Church Information",
          "Employment/Schooling Information",
          "Family Information",
          "Enrolled Programs",
        ]}
        selectedTab={selectedTab}
        onTabSelect={handleTabSelect}
        tabIcons={{
          "Basic Information": <UserIcon className="h-4 w-4" />,
          "Contact Information": <PhoneIcon className="h-4 w-4" />,
          "Church Information": <BuildingLibraryIcon className="h-4 w-4" />,
          "Employment/Schooling Information": <BriefcaseIcon className="h-4 w-4" />,
          "Family Information": <UsersIcon className="h-4 w-4" />,
          "Enrolled Programs": <AcademicCapIcon className="h-4 w-4" />,
        }}
      />
      
      {selectedTab === "Basic Information" && (
        <>
          {/* Personal Information */}
          <Section title="Personal Information">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8">
              <InfoField label="Title" value={user.title} />
              <InfoField label="First Name" value={user.first_name} />
              <InfoField label="Last Name" value={user.last_name} />
              <InfoField label="Middle Name" value={user.other_name} />
              <InfoField
                label="Date of Birth"
                value={formatDate(user.date_of_birth)}
              />
              <InfoField label="Nationality" value={user.nationality} />
              <InfoField label="Gender" value={user.gender} />
              <InfoField
                label="Marital Status"
                value={
                  user.marital_status
                    ? user.marital_status.charAt(0).toUpperCase() +
                      user.marital_status.slice(1).toLowerCase()
                    : "-"
                }
              />
            </div>
          </Section>
        </>
      )}

      {selectedTab === "Contact Information" && (
        <>
          <Section title="Personal Contact ">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8">
              <InfoField
                label="Contact Number"
                value={formatPhoneNumber(user.country_code, user.primary_number)}
              />
              <InfoField
                label="E-mail"
                value={
                  <a
                    href={`mailto:${user.email}`}
                    className="text-indigo-600 hover:underline"
                  >
                    {user.email || "-"}
                  </a>
                }
              />
            </div>
          </Section>
          <Section title="Emergency Contact">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8">
              <InfoField label="Name" value={user.emergency_contact?.name} />
              <InfoField
                label="Relation"
                value={user.emergency_contact?.relation}
              />
              <InfoField
                label="Contact Number"
                value={formatPhoneNumber(
                  user.emergency_contact?.country_code,
                  user.emergency_contact?.phone_number
                )}
              />
            </div>
          </Section>
        </>
      )}

      {selectedTab === "Church Information" && (
        <>
          <Section title="Membership Information">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8">
              <InfoField
                label="Membership ID"
                value={
                  <div className="flex items-center">
                    <span>{user.member_id || "-"}</span>
                    <span className="ml-2 text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
                      {membershipStatus}
                    </span>
                  </div>
                }
              />
              <InfoField label="Membership Type" value={membershipType} />
              <InfoField label="Member Status" value={membershipStatus} />
            </div>
          {/* </Section>
          <Section title="Church Information"> */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 mt-4">
              <InfoField
                label="Date Joined"
                value={
                  formatDate(user.member_since)
                }
              />
              <InfoField
                label="Ministry Worker Status"
                value={
                  <span
                    className={`px-3 py-1 rounded-full text-sm ${
                      user.is_user
                        ? "bg-green-100 text-green-800"
                        : "bg-gray-100 text-gray-800"
                    }`}
                  >
                    {user.is_user
                      ? "Active Ministry Worker"
                      : "Not a Ministry Worker"}
                  </span>
                }
              />
            </div>

            {user?.is_user && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 mt-4">
                <InfoField
                  label="Ministry/Department - Position"
                  value={
                    user?.department_positions?.length
                      ? user.department_positions.map((departmentPosition, index) => (
                          <div
                            key={getDepartmentPositionKey(departmentPosition, index)}
                            className="py-1"
                          >
                            <div>
                              <span className="font-medium">
                                {formatDepartmentPosition(departmentPosition)}
                              </span>
                            </div>
                          </div>
                        ))
                      : "-"
                  }
                />
                {/* <InfoField label="Position" value={user?.position?.name} /> */}
              </div>
            )}
          </Section>
        </>
      )}

      {selectedTab === "Employment/Schooling Information" && (
        <Section title="Work Information">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8">
            <InfoField
              label="Institution"
              value={user.work_info?.name_of_institution}
            />
            <InfoField label="Industry" value={user.work_info?.industry} />
            <InfoField label="Position" value={user.work_info?.position} />
          </div>
        </Section>
      )}

      {selectedTab === "Enrolled Programs" && (
        <>
          <Section title="Enrollment Summary">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-x-8">
              <InfoField label="Total Enrollments" value={enrolledProgramsSummary?.total} />
              <InfoField label="Completed" value={enrolledProgramsSummary?.completed} />
              <InfoField
                label="In Progress"
                value={enrolledProgramsSummary?.in_progress}
              />
            </div>
          </Section>

          <Section title="Program Details">
            {enrolledPrograms.length === 0 ? (
              <div className="rounded-lg border border-dashed border-gray-300 bg-gray-50 p-4 text-sm text-gray-600">
                No enrolled programs found.
              </div>
            ) : (
              <div className="space-y-4">
                {enrolledPrograms.map((enrollment, index) => (
                  <div
                    key={`${enrollment.enrollment_id}-${index}`}
                    className="rounded-lg border border-gray-200 p-4"
                  >
                    <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                      <h3 className="text-base font-semibold text-gray-900">
                        {enrollment.program?.name || "-"}
                      </h3>
                      <span
                        className={`w-fit rounded-full px-3 py-1 text-xs font-medium ${
                          enrollment.status?.completed
                            ? "bg-green-100 text-green-700"
                            : "bg-blue-100 text-blue-700"
                        }`}
                      >
                        {toTitleCase(enrollment.status?.label)}
                      </span>
                    </div>

                    <div className="mt-3 grid grid-cols-1 gap-2 text-sm md:grid-cols-2">
                      <p className="text-gray-700">
                        <span className="font-semibold text-gray-900">Cohort:</span>{" "}
                        {enrollment.cohort?.name || "-"}
                      </p>
                      <p className="text-gray-700">
                        <span className="font-semibold text-gray-900">Cohort Status:</span>{" "}
                        {toTitleCase(enrollment.cohort?.status)}
                      </p>
                      <p className="text-gray-700">
                        <span className="font-semibold text-gray-900">Facilitator:</span>{" "}
                        {enrollment.facilitator?.name || "-"}
                      </p>
                      <p className="text-gray-700">
                        <span className="font-semibold text-gray-900">Enrolled At:</span>{" "}
                        {enrollment.enrolled_at ? formatDate(enrollment.enrolled_at) : "-"}
                      </p>
                      <p className="text-gray-700">
                        <span className="font-semibold text-gray-900">Completed At:</span>{" "}
                        {enrollment.status?.completed_at
                          ? formatDate(enrollment.status.completed_at)
                          : "-"}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Section>
        </>
      )}

      {selectedTab=="Family Information" && (
        // <Section title="">
          <FamilyInformation familyData={user?.family} />
        // </Section>
      )}
    </div>
  );
}

interface IMemberInfo {
  membership_Id: string;
  member_id: string;
  membership_type: string;
  title: string;
  first_name: string;
  last_name: string;
  other_name?: string;
  date_of_birth: string;
  nationality: string;
  gender: string;
  marital_status: string;
  primary_number: string;
  country_code: string;
  email: string;
  is_user: boolean;
  status?: string;
  member_since: string;
  department?: {
    name:string
  };
  position?: {
    name:string
  };
  work_info: {
    name_of_institution: string;
    industry: string;
    position: string;
  };
  emergency_contact: {
    name: string;
    relation: string;
    phone_number: string;
    country_code:string
  };
  department_positions: Array<string | IDepartmentPosition>;
  family: unknown[];
  enrolled_programs?: IEnrolledPrograms;
}

interface IEnrolledPrograms {
  summary?: IEnrolledProgramSummary;
  items?: IEnrolledProgramItem[];
}

interface IEnrolledProgramSummary {
  total?: number;
  completed?: number;
  in_progress?: number;
}

interface IEnrolledProgramItem {
  enrollment_id: number | string;
  enrolled_at?: string;
  program?: {
    id?: number | string;
    name?: string;
  };
  cohort?: {
    id?: number | string;
    name?: string;
    status?: string;
  };
  facilitator?: {
    id?: number | string;
    name?: string;
  };
  status?: {
    completed?: boolean;
    label?: string;
    completed_at?: string | null;
  };
}

interface IDepartmentPosition {
  department_id?: number | string | null;
  department_name?: string | null;
  position_id?: number | string | null;
  position_name?: string | null;
}

const isDepartmentPosition = (value: unknown): value is IDepartmentPosition =>
  typeof value === "object" && value !== null;

const formatDepartmentPosition = (
  departmentPosition: string | IDepartmentPosition
): string => {
  if (typeof departmentPosition === "string") {
    return departmentPosition || "-";
  }

  const departmentName =
    typeof departmentPosition.department_name === "string"
      ? departmentPosition.department_name
      : "";
  const positionName =
    typeof departmentPosition.position_name === "string"
      ? departmentPosition.position_name
      : "";

  if (departmentName && positionName) {
    return `${departmentName} - ${positionName}`;
  }

  return departmentName || positionName || "-";
};

const getDepartmentPositionKey = (
  departmentPosition: string | IDepartmentPosition,
  index: number
) => {
  if (typeof departmentPosition === "string") {
    return `${departmentPosition}-${index}`;
  }

  return `${departmentPosition.department_id ?? "department"}-${
    departmentPosition.position_id ?? "position"
  }-${index}`;
};

const normalizeInfoValue = (value: unknown): ReactNode => {
  if (value === null || value === undefined || value === "") {
    return "-";
  }

  if (isValidElement(value)) {
    return value;
  }

  if (Array.isArray(value)) {
    return value.length > 0 ? value : "-";
  }

  if (
    typeof value === "string" ||
    typeof value === "number" ||
    typeof value === "bigint"
  ) {
    return value.toString();
  }

  if (typeof value === "boolean") {
    return value ? "Yes" : "No";
  }

  if (isDepartmentPosition(value)) {
    return formatDepartmentPosition(value);
  }

  return "-";
};

const InfoField = ({
  label,
  value,
}: {
  label: string;
  value: unknown;
}) => (
  <div className="mb-3">
    <p className="text-gray-600 font-medium  mb-1">{label}</p>
    <div className="font-semibold text-gray-900">{normalizeInfoValue(value)}</div>
  </div>
);

// Section component for consistent section styling
const Section = ({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) => (
  <section
    className="py-4"
    aria-labelledby={title.replace(/\s+/g, "-").toLowerCase()}
  >
    <h2
      id={title.replace(/\s+/g, "-").toLowerCase()}
      className="text-xl font-bold text-gray-800 mb-4"
    >
      {title}
    </h2>
    {children}
  </section>
);
