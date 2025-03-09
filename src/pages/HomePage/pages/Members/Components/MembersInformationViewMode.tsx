import { formatInputDate } from "@/utils/helperFunctions";
import React from "react";

interface MemberInfo {
  membership_Id: string;
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
  isMinistryWorker: boolean;
  ministryDepartment?: string;
  position?: string;
  work_info: {
    name_of_institution: string;
    industry: string;
    position: string;
  };
  emergency_contact: {
    name: string;
    relation: string;
    phone_number: string
  };
}

interface ViewModeProps {
  user: MemberInfo;
}

const MemberInformationViewMode: React.FC<ViewModeProps> = ({ user }) => {
  return (
    <div className="bg-white rounded-lg py-4 w-full mx-auto">
      {/* Membership Status */}
      <section className="mb-6">
        <h2 className="text-xl font-bold text-gray-800">Membership Status</h2>
        <div className="grid grid-cols-2 gap-4 mt-2">
          <div>
            <p className="text-sm text-gray-600">Membership ID</p>
            <p className="font-medium">{user.membership_Id || "-"}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Membership Type</p>
            <p className="font-medium">{user.membership_type || "-"}</p>
          </div>
        </div>
      </section>

      {/* Personal Information */}
      <section className="mb-6">
        <h2 className="text-xl font-bold text-gray-800">Personal Information</h2>
        <div className="grid grid-cols-2 gap-4 mt-2">
          <div>
            <p className="text-sm text-gray-600">Title</p>
            <p className="font-medium">{user.title}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600">First Name</p>
            <p className="font-medium">{user.first_name}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Other Name</p>
            <p className="font-medium">{user.other_name || "N/A"}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Last Name</p>
            <p className="font-medium">{user.last_name}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Date of Birth</p>
            <p className="font-medium">{formatInputDate(user.date_of_birth)}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Nationality</p>
            <p className="font-medium">{user.nationality}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Gender</p>
            <p className="font-medium">{user.gender}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Marital Status</p>
            <p className="font-medium capitalize">{user.marital_status}</p>
          </div>
        </div>
      </section>

      {/* Contact Information */}
      <section className="mb-6">
        <h2 className="text-xl font-bold text-gray-800">Contact Information</h2>
        <div className="grid grid-cols-2 gap-4 mt-2">
          <div>
            <p className="text-sm text-gray-600">Contact Number</p>
            <p className="font-medium">{user.country_code} {user.primary_number}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600">E-mail</p>
            <p className="font-medium">{user.email}</p>
          </div>
        </div>
      </section>

      {/* Church Information */}
      <section className="mb-6">
        <h2 className="text-xl font-bold text-gray-800">Church Information</h2>
        <div className="mt-2">
          <p className="text-sm text-gray-600">Is this member a ministry worker?</p>
          <p className="font-medium">{user.isMinistryWorker ? "Yes" : "No"}</p>
        </div>
        {user.isMinistryWorker && (
          <div className="grid grid-cols-2 gap-4 mt-2">
            <div>
              <p className="text-sm text-gray-600">Ministry/Department</p>
              <p className="font-medium">{user.ministryDepartment}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Position</p>
              <p className="font-medium">{user.position}</p>
            </div>
          </div>
        )}
      </section>

      {/* Work Information */}
      <section className="mb-6">
        <h2 className="text-xl font-bold text-gray-800">Work Information</h2>
        <div className="grid grid-cols-2 gap-4 mt-2">
          <div>
            <p className="text-sm text-gray-600">Institution</p>
            <p className="font-medium">{user.work_info?.name_of_institution}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Industry</p>
            <p className="font-medium">{user?.work_info?.industry|| "-" }</p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Position</p>
            <p className="font-medium">{user?.work_info?.position}</p>
          </div>
        </div>
      </section>

      {/* Emergency Contact */}
      <section className="mb-6">
        <h2 className="text-xl font-bold text-gray-800">Emergency Contact</h2>
        <div className="grid grid-cols-2 gap-4 mt-2">
          <div>
            <p className="text-sm text-gray-600">Name</p>
            <p className="font-medium">{user?.emergency_contact?.name}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Relation</p>
            <p className="font-medium">{user?.emergency_contact?.relation}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Contact Number</p>
            <p className="font-medium">{user?.emergency_contact?.phone_number}</p>
          </div>
        </div>
      </section>
    </div>
  );
};



 
export default MemberInformationViewMode;