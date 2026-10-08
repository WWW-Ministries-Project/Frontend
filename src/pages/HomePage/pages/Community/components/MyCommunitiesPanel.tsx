import { UserGroupIcon } from "@heroicons/react/24/outline";
import { cn } from "@/utils/cn";
import type { CommunityDepartment } from "@/utils/api/community/interfaces";
import { communityBodyToPlainText } from "../utils/communityBody";
import { firstName, plural } from "../utils/communityHelpers";

interface MyCommunitiesPanelProps {
  departments: CommunityDepartment[];
  activeDepartmentId: number | null;
  onSelect: (department: CommunityDepartment) => void;
}

const TINTS = [
  "bg-sky-50 text-sky-700",
  "bg-amber-50 text-amber-700",
  "bg-violet-50 text-violet-700",
  "bg-teal-50 text-teal-700",
];

/** "My communities": one row per department the viewer belongs to. Each opens
 *  that department's feed. */
export const MyCommunitiesPanel = ({
  departments,
  activeDepartmentId,
  onSelect,
}: MyCommunitiesPanelProps) => {
  if (!departments.length) {
    return (
      <p className="text-sm text-primaryGray">
        You&apos;ll see your departments here once you join one.
      </p>
    );
  }

  return (
    <ul className="flex flex-col gap-2">
      {departments.map((department, index) => {
        const latest = department.latest
          ? `${
              department.latest.authorName
                ? firstName(department.latest.authorName)
                : "Anonymous"
            }: ${communityBodyToPlainText(department.latest.body)}`
          : "No posts yet";
        return (
          <li key={department.id}>
            <button
              type="button"
              onClick={() => onSelect(department)}
              aria-current={activeDepartmentId === department.id}
              className={cn(
                "flex w-full items-start gap-3 rounded-xl border px-3 py-3 text-left transition-colors",
                activeDepartmentId === department.id
                  ? "border-amber-300 bg-amber-50"
                  : "border-lightGray bg-white hover:bg-lightGray/30"
              )}
            >
              <span
                className={cn(
                  "inline-flex h-10 w-10 flex-none items-center justify-center rounded-xl",
                  TINTS[index % TINTS.length]
                )}
              >
                <UserGroupIcon className="h-5 w-5" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-semibold text-primary">
                  {department.name}
                </span>
                <span className="block text-xs text-primaryGray">
                  Department · {plural(department.memberCount, "member")}
                </span>
                <span className="mt-1 block truncate text-xs text-primaryGray">
                  {latest}
                </span>
              </span>
            </button>
          </li>
        );
      })}
    </ul>
  );
};
