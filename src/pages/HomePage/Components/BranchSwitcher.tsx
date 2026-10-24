import { useEffect, useId, useMemo, useRef, useState } from "react";

import {
  ALL_BRANCHES,
  type ActiveBranchId,
  selectAccessibleBranches,
  useBranchStore,
} from "@/store/useBranchStore";
import { useUserStore } from "@/store/userStore";
import { cn } from "@/utils/cn";

const BranchIcon = ({ className }: { className?: string }) => (
  <svg
    width="18"
    height="18"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.8"
    aria-hidden="true"
    className={cn("shrink-0", className)}
  >
    <path d="M3 21h18M5 21V8l7-5 7 5v13M9 21v-6h6v6" />
  </svg>
);

type Option = {
  id: ActiveBranchId;
  name: string;
  role: string | null;
};

/**
 * The branch the admin is working in, top right of the header.
 * - One branch: a static pill (nothing to switch).
 * - Several: a button that opens "Your branches", with the user's role in each
 *   and "All my branches" first.
 * Everything the app lists or saves follows the branch picked here.
 */
export function BranchSwitcher() {
  const branches = useBranchStore(selectAccessibleBranches);
  const allowedBranchIds = useBranchStore((state) => state.allowedBranchIds);
  const activeBranchId = useBranchStore((state) => state.activeBranchId);
  const setActiveBranchId = useBranchStore((state) => state.setActiveBranchId);
  const branchAccess = useUserStore((state) => state.branch_access);

  const [open, setOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const listId = useId();

  const isLimited = Boolean(allowedBranchIds);
  const roleIn = (branchId: number) =>
    branchAccess?.find((grant) => grant.branch_id === branchId)?.access_level_name ||
    null;

  const options = useMemo<Option[]>(() => {
    const own = branches.map((branch) => ({
      id: branch.id,
      name: branch.name,
      role: roleIn(branch.id),
    }));
    if (own.length < 2) return own;
    return [
      {
        id: ALL_BRANCHES,
        name: isLimited ? "All my branches" : "All branches",
        role: isLimited
          ? `${own.length} branches · your role differs per branch`
          : null,
      },
      ...own,
    ];
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [branches, branchAccess, isLimited]);

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (event: MouseEvent) => {
      if (!wrapperRef.current?.contains(event.target as Node)) setOpen(false);
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpen(false);
        triggerRef.current?.focus();
      }
    };
    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  if (branches.length === 0) return null;

  const current =
    options.find((option) => option.id === activeBranchId) ?? options[0];
  const currentRole =
    current.id === ALL_BRANCHES
      ? isLimited
        ? "Your role differs per branch"
        : null
      : current.role;

  if (branches.length === 1) {
    return (
      <div
        title={`Your branch: ${current.name}`}
        className="flex min-h-10 items-center gap-2 rounded-lg border border-borderGray bg-background px-2.5 py-1 text-primary"
      >
        <BranchIcon />
        <span className="hidden min-w-0 flex-col leading-[18px] phone:flex">
          <span className="max-w-[160px] truncate text-sm font-semibold sm:max-w-[220px]">
            {current.name}
          </span>
          {currentRole && (
            <span className="hidden text-xs text-primaryGray sm:block">{currentRole}</span>
          )}
        </span>
      </div>
    );
  }

  const pick = (id: ActiveBranchId) => {
    setActiveBranchId(id);
    setOpen(false);
    triggerRef.current?.focus();
  };

  return (
    <div ref={wrapperRef} className="relative">
      <button
        ref={triggerRef}
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={open ? listId : undefined}
        aria-label={`Switch branch, currently ${current.name}`}
        title={current.name}
        className="flex min-h-10 max-w-[160px] items-center gap-1.5 rounded-lg border border-lightGray bg-white px-2 py-1 text-left text-primary hover:bg-background focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/10 phone:gap-2 phone:px-2.5 sm:max-w-[240px]"
      >
        <BranchIcon />
        {/* Below 450px the trigger collapses to icon + chevron so the header fits. */}
        <span className="hidden min-w-0 flex-col leading-[18px] phone:flex">
          <span className="truncate text-sm font-semibold">{current.name}</span>
          {currentRole && (
            <span className="hidden truncate text-xs text-primaryGray sm:block">
              {currentRole}
            </span>
          )}
        </span>
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          aria-hidden="true"
          className="shrink-0"
        >
          <path d="m6 9 6 6 6-6" />
        </svg>
      </button>

      {open && (
        <div
          id={listId}
          role="listbox"
          aria-label="Your branches"
          className="absolute right-0 top-full z-[60] mt-2 w-72 max-w-[calc(100vw-32px)] rounded-md border border-borderGray bg-white py-1 shadow-lg"
        >
          <p className="px-4 pb-1 pt-2 text-xs font-semibold uppercase tracking-wide text-primaryGray">
            Your branches
          </p>
          {options.map((option) => {
            const selected = option.id === current.id;
            const role =
              option.id === ALL_BRANCHES
                ? option.role
                : option.role
                  ? `You’re ${option.role}`
                  : null;
            return (
              <button
                key={String(option.id)}
                type="button"
                role="option"
                aria-selected={selected}
                onClick={() => pick(option.id)}
                className={cn(
                  "flex w-full items-center gap-3 px-4 py-3 text-left text-primary hover:bg-background focus-visible:bg-background focus-visible:outline-none",
                  selected ? "bg-background" : "bg-white"
                )}
              >
                <span className="flex min-w-0 flex-1 flex-col">
                  <span className={cn("text-sm", selected ? "font-semibold" : "font-normal")}>
                    {option.name}
                  </span>
                  {role && <span className="text-xs text-primaryGray">{role}</span>}
                </span>
                {selected && (
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                    aria-hidden="true"
                  >
                    <path d="M5 12.5l4.5 4.5L19 7.5" />
                  </svg>
                )}
              </button>
            );
          })}
          <p className="mt-1 border-t border-borderGray px-4 py-2 text-xs text-primaryGray">
            You only see data from the branch you pick.
            {isLimited && " Your role can differ per branch."}
          </p>
        </div>
      )}
    </div>
  );
}
