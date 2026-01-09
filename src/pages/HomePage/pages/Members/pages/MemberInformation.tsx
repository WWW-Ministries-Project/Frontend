import { useState } from "react";
import TabSelection from "@/pages/HomePage/Components/reusable/TabSelection";
import { formatDate, formatPhoneNumber } from "@/utils";
import {
  UserIcon,
  PhoneIcon,
  BuildingLibraryIcon,
  BriefcaseIcon,
  UsersIcon,
} from "@heroicons/react/24/outline";

import { useOutletContext } from "react-router-dom";
import { FamilyInformation } from "./FamilyInformation";

//TODO: TAKE A SECOND LOOK AT INFOFIELD AND SECTION
//TODO: FIND A BETTER STRUCTURE FOR TYPING DATA FROM BE
export function MemberInformation() {
  const { details: user } = useOutletContext<{
    details: IMemberInfo;
  }>();

  const [selectedTab, setSelectedTab] = useState("Basic Information");

  const handleTabSelect = (tab: string) => {
    setSelectedTab(tab);
  };

  // Derive membership status for display
  const membershipType =
    user.membership_type === "ONLINE"
      ? "Online e-church family"
      : user.membership_type === "IN_HOUSE"? "In-person church family" :"";

  return (
    <div className="bg-white rounded-b-lg  p-6 pt-0 mx-auto text-gray-800 ">
      <TabSelection
        tabs={[
          "Basic Information",
          "Contact Information",
          "Church Information",
          "Employment/Schooling Information",
          "Family Information",
        ]}
        selectedTab={selectedTab}
        onTabSelect={handleTabSelect}
        tabIcons={{
          "Basic Information": <UserIcon className="h-4 w-4" />,
          "Contact Information": <PhoneIcon className="h-4 w-4" />,
          "Church Information": <BuildingLibraryIcon className="h-4 w-4" />,
          "Employment/Schooling Information": <BriefcaseIcon className="h-4 w-4" />,
          "Family Information": <UsersIcon className="h-4 w-4" />,
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
                      Active Member
                    </span>
                  </div>
                }
              />
              <InfoField label="Membership Type" value={membershipType} />
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
                  value={user?.department_positions?.map((department_position, index) =>
                    <div key={index} className="py-1">
                      <div>{ department_position.department_name} - <span className="font-medium">{department_position.position_name}</span></div>
                    </div> 
                  )}
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

      {selectedTab=="Family Information" && (
        // <Section title="">
          <FamilyInformation/>
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
  department_positions: string[]
  
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
