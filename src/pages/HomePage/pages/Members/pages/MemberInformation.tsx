
import { formatDate, formatPhoneNumber } from "@/utils";

import { useOutletContext } from "react-router-dom";

//TODO: TAKE A SECOND LOOK AT INFOFIELD AND SECTION
//TODO: FIND A BETTER STRUCTURE FOR TYPING DATA FROM BE
export function MemberInformation() {
  const { details: user } = useOutletContext<{
    details: IMemberInfo;
  }>();

  // Derive membership status for display
  const membershipType =
    user.membership_type === "ONLINE"
      ? "Online e-church family"
      : user.membership_type === "IN_HOUSE"? "In-person church family" :"";

  return (
    <div className="bg-white rounded-b-lg shadow-sm p-6 pt-0 mx-auto text-gray-800 ">
      {/* <div className="flex  mb-6">
        <TabSelection
        tabs={["Member information", "Family information", "Enrolled programs"]}
        selectedTab="Member information"
        onTabSelect={() => {}}
      />
      </div> */}
      
      {/* Membership Status */}
      <Section title="Membership Status">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8">
          <InfoField
            label="Membership ID"
            value={
              <div className="flex items-center">
                <span>{user.member_id || "-"}</span>
                <span className="ml-2 text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
                  Active Member
                </span>
              </div>
            }
          />
          <InfoField label="Membership Type" value={membershipType} />
        </div>
      </Section>

      <hr className="border-t border-gray-200" />

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

      <hr className="border-t border-gray-200" />

      {/* Contact Information */}
      <Section title="Contact Information">
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

      <hr className="border-t border-gray-200" />

      {/* Church Information */}
      <Section title="Church Information">
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
              label="Ministry/Department"
              value={user?.department?.name}
            />
            <InfoField label="Position" value={user?.position?.name} />
          </div>
        )}
      </Section>

      <hr className="border-t border-gray-200" />

      {/* Work Information */}
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

      <hr className="border-t border-gray-200" />

      {/* Emergency Contact */}
      <Section title="Emergency Contact">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8">
          <InfoField label="Name" value={user.emergency_contact?.name} />
          <InfoField
            label="Relation"
            value={user.emergency_contact?.relation}
          />
          <InfoField
            label="Contact Number"
            value={user.emergency_contact?.phone_number}
          />
        </div>
      </Section>
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
  };
  
}
const InfoField = ({
  label,
  value,
}: {
  label: string;
  value: string | React.ReactNode;
}) => (
  <div className="mb-3">
    <p className="text-gray-600 font-medium  mb-1">{label}</p>
    <div className="font-semibold text-gray-900">{value || "-"}</div>
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
