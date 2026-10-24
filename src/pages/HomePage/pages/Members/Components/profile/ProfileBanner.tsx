import { ReactNode, useEffect, useRef, useState } from "react";
import { ArrowLeftIcon, EnvelopeIcon, PhoneIcon } from "@heroicons/react/24/outline";

import {
  ActionMenuItem,
  BandTabs,
} from "@/pages/HomePage/pages/MembershipManagement/components/membershipUi";
import { initialsOf } from "@/pages/HomePage/pages/MembershipManagement/components/membershipUiUtils";
import { cn } from "@/utils/cn";

import { PROFILE_TABS, ProfileTab } from "./profileHelpers";

const BannerMenu = ({ items }: { items: ActionMenuItem[] }) => {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const visible = items.filter((item) => !item.hidden);

  useEffect(() => {
    if (!open) return;
    const close = (event: MouseEvent) => {
      if (ref.current && !ref.current.contains(event.target as Node)) setOpen(false);
    };
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", close);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", close);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  if (visible.length === 0) return null;

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        aria-label="More actions"
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen((prev) => !prev)}
        className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-white/40 bg-transparent text-lg leading-none text-white transition-colors hover:bg-white/10"
      >
        ⋯
      </button>
      {open && (
        <div
          role="menu"
          className="absolute right-0 top-full z-50 mt-2 w-[220px] rounded-md border border-gray-200 bg-white py-1 shadow-[0_10px_15px_-3px_rgba(0,0,0,0.1),0_4px_6px_-4px_rgba(0,0,0,0.1)]"
        >
          {visible.map((item) => (
            <button
              key={item.label}
              type="button"
              role="menuitem"
              onClick={() => {
                setOpen(false);
                item.onClick();
              }}
              className={cn(
                "block w-full px-4 py-3 text-left text-sm transition-colors hover:bg-gray-100",
                item.danger ? "text-red-700" : "text-primary"
              )}
            >
              {item.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export interface ProfileBannerProps {
  name: string;
  memberId?: string | null;
  email?: string | null;
  phone?: string | null;
  photo?: string | null;
  pills: string[];
  onBack: () => void;
  onEdit?: () => void;
  menuItems: ActionMenuItem[];
  tab: ProfileTab;
  onTabChange: (tab: ProfileTab) => void;
  note?: ReactNode;
}

export const ProfileBanner = ({
  name,
  memberId,
  email,
  phone,
  photo,
  pills,
  onBack,
  onEdit,
  menuItems,
  tab,
  onTabChange,
  note,
}: ProfileBannerProps) => {
  const [photoFailed, setPhotoFailed] = useState(false);
  const showPhoto = Boolean(photo) && !photoFailed;

  return (
    <div className="relative w-full overflow-hidden bg-primary text-white">
      <div className="pointer-events-none absolute inset-0 overflow-hidden opacity-10" aria-hidden="true">
        <div className="absolute right-0 top-0 h-64 w-64 -translate-y-1/2 translate-x-1/3 rounded-full bg-white" />
        <div className="absolute bottom-0 left-0 h-48 w-48 -translate-x-1/4 translate-y-1/3 rounded-full bg-white" />
      </div>
      <div className="pointer-events-none absolute left-0 top-0 h-20 w-20 border-l-2 border-t-2 border-white/20" aria-hidden="true" />
      <div className="pointer-events-none absolute right-0 top-0 h-20 w-20 border-r-2 border-t-2 border-white/20" aria-hidden="true" />

      <div className="relative flex flex-col gap-4 px-4 pt-5 sm:px-6">
        <button
          type="button"
          onClick={onBack}
          className="flex items-center gap-2 self-start bg-transparent p-0 text-sm text-white/90 transition-colors hover:text-white"
        >
          <ArrowLeftIcon className="h-4 w-4" aria-hidden="true" />
          <span>Back to members</span>
        </button>

        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex min-w-0 flex-wrap items-center gap-4">
            <div className="flex h-28 w-28 flex-shrink-0 items-center justify-center overflow-hidden rounded-xl border border-gray-200 bg-lightGray/50 text-2xl font-bold outline outline-1 outline-white">
              {showPhoto ? (
                <img
                  src={photo ?? ""}
                  alt=""
                  className="h-full w-full object-cover"
                  onError={() => setPhotoFailed(true)}
                />
              ) : (
                initialsOf(name)
              )}
            </div>
            <div className="flex min-w-0 flex-col gap-2">
              <h1 className="text-2xl font-semibold leading-8">{name}</h1>
              <p className="text-sm text-white/90"># {memberId || "—"}</p>
              {(email || phone) && (
                <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-white/90">
                  {email && (
                    <span className="flex min-w-0 items-center gap-2 [overflow-wrap:anywhere]">
                      <EnvelopeIcon className="h-4 w-4 flex-shrink-0" aria-hidden="true" />
                      {email}
                    </span>
                  )}
                  {phone && (
                    <span className="flex items-center gap-2">
                      <PhoneIcon className="h-4 w-4 flex-shrink-0" aria-hidden="true" />
                      {phone}
                    </span>
                  )}
                </div>
              )}
              {pills.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {pills.map((pill) => (
                    <span
                      key={pill}
                      className="rounded-full border border-white bg-white px-2.5 py-0.5 text-xs font-semibold text-primary"
                    >
                      {pill}
                    </span>
                  ))}
                </div>
              )}
              {note}
            </div>
          </div>

          {(onEdit || menuItems.some((item) => !item.hidden)) && (
            <div className="flex items-center gap-2">
              {onEdit && (
                <button
                  type="button"
                  onClick={onEdit}
                  className="min-h-10 rounded-lg bg-white px-5 py-2 text-sm font-medium text-primary transition-colors hover:bg-gray-100"
                >
                  Edit profile
                </button>
              )}
              <BannerMenu items={menuItems} />
            </div>
          )}
        </div>

        <BandTabs
          tabs={PROFILE_TABS}
          value={tab}
          onChange={onTabChange}
          ariaLabel="Profile sections"
        />
      </div>
    </div>
  );
};
