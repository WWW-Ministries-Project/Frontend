import { useAccessControl } from "@/CustomHooks/useAccessControl";
import { decodeQuery } from "@/pages/HomePage/utils";
import { useUserStore } from "@/store/userStore";
import { Navigate, useLocation, useParams } from "react-router-dom";

// Blocks member profile/edit pages for members on the viewer's Members
// exclusion list, including when the URL is opened directly. The backend
// rejects these requests too; this keeps the page from loading at all.
export const MemberExclusionGuard = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const location = useLocation();
  const { id } = useParams();
  const { isExcluded } = useAccessControl();
  const currentUserId = Number(useUserStore((state) => state.id));

  const rawId = id ?? new URLSearchParams(location.search).get("member_id");
  const targetUserId = rawId ? Number(decodeQuery(rawId)) : NaN;
  const isBlocked =
    Number.isInteger(targetUserId) &&
    targetUserId > 0 &&
    targetUserId !== currentUserId &&
    isExcluded("Members", targetUserId);

  if (!isBlocked) return <>{children}</>;

  return (
    <Navigate
      to="/home/access-denied"
      replace
      state={{ from: location.pathname }}
    />
  );
};
