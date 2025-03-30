import { formatInputDate } from "@/utils/helperFunctions";
import React from "react";

interface MemberInfo {
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
    <div className="bg-white rounded-lg container  w-full mx-auto text-dark900 space-y-6">
      {/* Membership Status */}
      <section className="">
        <h2 className="text-xl font-bold ">Membership Status</h2>
        <div className="grid grid-cols-2 gap-4 mt-2">
          <div>
            <p className=" text-gray-600 font-semibold">Membership ID</p>
            <p className="font-medium">{user.member_id || "-"}</p>
          </div>
          <div>
            <p className=" text-gray-600 font-semibold">Membership Type</p>
            <p className="font-medium">{user.membership_type === "MEMBER" ? "Online e-church family" : "In-person church family"}</p>
          </div>
        </div>
      </section>

      <hr className="border-t border-neutralGray " />

      {/* Personal Information */}
      <section className="">
        <h2 className="text-xl font-bold text-gray-800">Personal Information</h2>
        <div className="grid grid-cols-2 gap-4 mt-2">
          <div>
            <p className=" text-gray-600 font-semibold">Title</p>
            <p className="font-medium">{user.title || "-"}</p>
          </div>
          <div>
            <p className=" text-gray-600 font-semibold">First Name</p>
            <p className="font-medium">{user.first_name || "-"}</p>
          </div>
          <div>
            <p className=" text-gray-600 font-semibold">Other Name</p>
            <p className="font-medium">{user.other_name || "-"}</p>
          </div>
          <div>
            <p className=" text-gray-600 font-semibold">Last Name</p>
            <p className="font-medium">{user.last_name || "-"}</p>
          </div>
          <div>
            <p className=" text-gray-600 font-semibold">Date of Birth</p>
            <p className="font-medium">{formatInputDate(user.date_of_birth) || "-"}</p>
          </div>
          <div>
            <p className=" text-gray-600 font-semibold">Nationality</p>
            <p className="font-medium">{user.nationality || "-"}</p>
          </div>
          <div>
            <p className=" text-gray-600 font-semibold">Gender</p>
            <p className="font-medium">{user.gender || "-"}</p>
          </div>
          <div>
            <p className=" text-gray-600 font-semibold">Marital Status</p>
            <p className="font-medium capitalize">{user.marital_status || "-"}</p>
          </div>
        </div>
      </section>

      <hr className="border-t border-neutralGray " />

      {/* Contact Information */}
      <section className="">
        <h2 className="text-xl font-bold text-gray-800">Contact Information</h2>
        <div className="grid grid-cols-2 gap-4 mt-2">
          <div>
            <p className=" text-gray-600 font-semibold">Contact Number</p>
            <p className="font-medium">{`${user.country_code} ${user.primary_number}` || "-"}</p>
          </div>
          <div>
            <p className=" text-gray-600 font-semibold">E-mail</p>
            <p className="font-medium">{user.email || "-"}</p>
          </div>
        </div>
      </section>

      <hr className="border-t border-neutralGray " />

      {/* Church Information */}
      <section className="">
        <h2 className="text-xl font-bold text-gray-800">Church Information</h2>
        <div className="mt-2">
          <p className=" text-gray-600 font-semibold">Is this member a ministry worker?</p>
          <p className="font-medium">{user.isMinistryWorker ? "Yes" : "No"}</p>
        </div>
        {user.isMinistryWorker && (
          <div className="grid grid-cols-2 gap-4 mt-2">
            <div>
              <p className=" text-gray-600 font-semibold">Ministry/Department</p>
              <p className="font-medium">{user.ministryDepartment || "-"}</p>
            </div>
            <div>
              <p className=" text-gray-600 font-semibold">Position</p>
              <p className="font-medium">{user.position || "-"}</p>
            </div>
          </div>
        )}
      </section>

      <hr className="border-t border-neutralGray " />

      {/* Work Information */}
      <section className="">
        <h2 className="text-xl font-bold text-gray-800">Work Information</h2>
        <div className="grid grid-cols-2 gap-4 mt-2">
          <div>
            <p className=" text-gray-600 font-semibold">Institution</p>
            <p className="font-medium">{user.work_info?.name_of_institution || "-"}</p>
          </div>
          <div>
            <p className=" text-gray-600 font-semibold">Industry</p>
            <p className="font-medium">{user?.work_info?.industry|| "-" }</p>
          </div>
          <div>
            <p className=" text-gray-600 font-semibold">Position</p>
            <p className="font-medium">{user?.work_info?.position || "-"}</p>
          </div>
        </div>
      </section>

      <hr className="border-t border-neutralGray " />

      {/* Emergency Contact */}
      <section className="">
        <h2 className="text-xl font-bold text-gray-800">Emergency Contact</h2>
        <div className="grid grid-cols-2 gap-4 mt-2">
          <div>
            <p className=" text-gray-600 font-semibold">Name</p>
            <p className="font-medium">{user?.emergency_contact?.name|| "-"}</p>
          </div>
          <div>
            <p className=" text-gray-600 font-semibold">Relation</p>
            <p className="font-medium">{user?.emergency_contact?.relation|| "-"}</p>
          </div>
          <div>
            <p className=" text-gray-600 font-semibold">Contact Number</p>
            <p className="font-medium">{user?.emergency_contact?.phone_number || "-"}</p>
          </div>
        </div>
      </section>
    </div>
  );
};



 
export default MemberInformationViewMode;