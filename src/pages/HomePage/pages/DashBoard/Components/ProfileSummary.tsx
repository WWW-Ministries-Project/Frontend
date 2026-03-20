import { Button, ProfilePicture } from "@/components";
import { encodeQuery } from "@/pages/HomePage/utils";
import { useUserStore } from "@/store/userStore";
import { formatDatefull, relativePath } from "@/utils";
import { useLocation, useNavigate } from "react-router-dom";

export const ProfileSummary = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const userData = useUserStore((state) => state);
  const isMemberRoute = location.pathname.startsWith(relativePath.member.main);
  const adminProfilePath = userData?.id
    ? `${relativePath.home.main}/members/${encodeQuery(userData.id)}`
    : "";
  const profilePath = isMemberRoute ? relativePath.member.profile : adminProfilePath;

  const membershipNumber = userData?.member_id || "-";
  const membershipSince = (() => {
    if (!userData?.member_since) return "-";

    const parsedDate = new Date(userData.member_since);
    if (Number.isNaN(parsedDate.getTime())) return "-";

    return formatDatefull(parsedDate);
  })();

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
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 mb-6 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <p className="text-sm font-medium text-gray-500 mb-1">
            Membership Number
          </p>
          <p className="text-sm text-gray-800 break-words [overflow-wrap:anywhere]">
            {membershipNumber}
          </p>
        </div>
        <div>
          <p className="text-sm font-medium text-gray-500 mb-1">Member Since</p>
          <p className="text-sm text-gray-800">{membershipSince}</p>
        </div>
        <div>
          <p className="text-sm font-medium text-gray-500 mb-1">Member Type</p>
          <p className="text-sm text-gray-800">
            {userData?.membership_type || "-"}
          </p>
        </div>
      </div>

      <Button
        value="View Profile"
        variant="secondary"
        className="w-full"
        disabled={!profilePath}
        onClick={() => {
          if (!profilePath) return;
          navigate(profilePath);
        }}
      />
    </div>
  );
};
