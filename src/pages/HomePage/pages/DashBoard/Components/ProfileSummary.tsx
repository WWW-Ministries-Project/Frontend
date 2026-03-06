import { ProfilePicture } from "@/components";
import { useUserStore } from "@/store/userStore";
import { formatDatefull } from "@/utils";

export const ProfileSummary = () => {
  const userData = useUserStore((state) => state);
  console.log("user data", userData);
  

  return (
    <div className="overflow-hidden rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
      <h3 className="text-xl font-semibold text-gray-800 mb-6">
        My Profile Summary
      </h3>

      <div className="mb-6 flex min-w-0 items-start gap-4">
        <ProfilePicture
          name={userData?.name || ""}
          className="w-16 h-16 bg-primary border-2 border-gray-200"
          textClass="text-white font-bold text-xl"
          alt="profile picture"
        />
        <div className="min-w-0 flex-1">
          <h4 className="text-lg font-semibold text-gray-800 break-words [overflow-wrap:anywhere]">
            {userData?.name || "Name not available"}
          </h4>
          <p className="mb-1 text-sm text-gray-600 break-all">
            {userData?.email || "Email not available"}
          </p>
          {userData?.phone && (
            <p className="text-sm text-gray-600 break-all">{userData.phone}</p>
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
