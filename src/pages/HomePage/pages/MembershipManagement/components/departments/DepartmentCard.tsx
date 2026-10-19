import {
  ActionMenu,
  Pill,
  UiButton,
  type ActionMenuItem,
} from "@/pages/HomePage/pages/MembershipManagement/components/membershipUi";

import { departmentStatusPill, type DepartmentRecord } from "./departmentShared";

export const DepartmentCard = ({
  department,
  pendingRequests,
  menuItems,
  onOpen,
}: {
  department: DepartmentRecord;
  /** `null` when the viewer can't see join requests. */
  pendingRequests: number | null;
  menuItems: ActionMenuItem[];
  onOpen: () => void;
}) => {
  const status = departmentStatusPill(department.status);
  const headName = department.department_head_info?.name?.trim();

  return (
    <article className="flex flex-col gap-4 rounded-2xl border border-lightGray bg-white p-4 shadow-[0_8px_24px_rgba(8,13,45,0.08)] transition-shadow hover:shadow-[0_10px_28px_rgba(8,13,45,0.2)]">
      <div className="flex items-start gap-3">
        <div className="flex min-w-0 flex-1 flex-col gap-1">
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={onOpen}
              className="bg-transparent p-0 text-left text-xl font-semibold leading-7 text-primary"
            >
              {department.name}
            </button>
            <Pill tone={status.tone}>{status.label}</Pill>
          </div>
          <p className={headName ? "text-sm text-[#4B5563]" : "text-sm text-[#B45309]"}>
            {headName ? `Head: ${headName}` : "Head not assigned"}
          </p>
        </div>
        <ActionMenu items={menuItems} ariaLabel="Department actions" width={200} />
      </div>

      <p className="line-clamp-2 text-sm text-[#4B5563]">
        {department.description?.trim() || "No description yet."}
      </p>

      <div className="grid grid-cols-2 gap-2">
        <div className="rounded-lg bg-[#F8F9FC] p-3">
          <p className="text-xs text-[#4B5563]">Members</p>
          <p className="text-lg font-semibold text-primary">{department.member_count ?? 0}</p>
        </div>
        <div className="rounded-lg bg-[#F8F9FC] p-3">
          <p className="text-xs text-[#4B5563]">Pending requests</p>
          <p className="text-lg font-semibold text-primary">{pendingRequests ?? "—"}</p>
        </div>
      </div>

      <UiButton tone="secondary" onClick={onOpen} className="mt-auto w-full">
        View department
      </UiButton>
    </article>
  );
};
