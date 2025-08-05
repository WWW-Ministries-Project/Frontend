import { ProfilePicture } from "@/components";
import { useUserStore } from "@/store/userStore";
import { formatDatefull } from "@/utils";

export const ProfileSummary = () => {
  const userData = useUserStore((state) => state);
  console.log("userData", userData);
  

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <h3 className="text-xl font-semibold text-gray-800 mb-6">
        My Profile Summary
      </h3>

      <div className="flex items-start gap-4 mb-6">
        <ProfilePicture
          name={userData?.name || ""}
          className="w-16 h-16 bg-primary border-2 border-gray-200"
          textClass="text-white font-bold text-xl"
          alt="profile picture"
        />
        <div className="flex-1">
          <h4 className="font-semibold text-gray-800 text-lg">
            {userData?.name || "Name not available"}
          </h4>
          <p className="text-gray-600 text-sm mb-1">
            {userData?.email || "Email not available"}
          </p>
          {userData?.phone && (
            <p className="text-gray-600 text-sm">{userData.phone}</p>
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-6">
        <div>
          <p className="text-sm font-medium text-gray-500 mb-1">Member Since</p>
          <p className="text-sm text-gray-800">
            {formatDatefull(userData?.member_since || "") || "-"}
          </p>
        </div>
        <div>
          <p className="text-sm font-medium text-gray-500 mb-1">Member Type</p>
          <p className="text-sm text-gray-800">
            {userData?.membership_type || "-"}
          </p>
        </div>
      </div>

      <div className="mb-6">
        <p className="text-sm font-medium text-gray-500 mb-3">
          Ministries & Department
        </p>
        <div className="flex flex-wrap gap-2">
          {userData?.department &&
          Array.isArray(userData.department) &&
          userData.department.length > 0 ? (
            userData.department.map((department, index) => (
              <span
                key={index}
                className="px-3 py-1 bg-primary text-white text-xs rounded-full"
              >
                {department}
              </span>
            ))
          ) : (
            <span className="text-sm text-gray-500 italic">
              No departments assigned
            </span>
          )}
        </div>
      </div>
    </div>
  );
};
