import CardWrapper from "@/Wrappers/CardWrapper";
import ellipse from "@/assets/ellipse.svg";
import email from "@/assets/email.svg";
import phone from "@/assets/phone.svg";
import { Button, ProfilePicture } from "@/components";
import Action from "@/components/Action";
import { encodeQuery } from "@/pages/HomePage/utils";
import { MembersType } from "@/utils";
import { CreditCardIcon, EnvelopeIcon, PhoneIcon } from "@heroicons/react/24/outline";
import { useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";

interface IProps {
  // userInfo: UserType;
  member: MembersType;
  showOptions: boolean;
  onShowOptions: () => void;
  onCloseOptions: () => void;
  onDelete: (val?: MembersType) => void;
  canManage?: boolean;
}

export const MemberCard = (props: IProps) => {
  const {
    member,
    showOptions,
    onShowOptions,
    onCloseOptions,
    onDelete,
    canManage,
  } = props;
  const navigate = useNavigate();
  const optionsRef = useRef<HTMLDivElement | null>(null);

  const membershipLabel =
    member?.membership_type === "IN_HOUSE"
      ? "In person"
      : member?.membership_type === "ONLINE"
        ? "Online"
        : member?.membership_type || "Membership pending";
  const memberRoleLabel = member?.is_user ? "Ministry worker" : "Church member";
  const statusLabel = member?.status
    ? member.status.replace(/_/g, " ")
    : "Profile pending";
  const departmentLabel = member?.department_name || "No department assigned";
  const memberIdLabel = member?.member_id || "Member ID pending";
  const phoneLabel =
    `${member?.country_code ? `${member.country_code} ` : ""}${member?.primary_number || ""}`.trim() ||
    "No phone number";

  const handleDelete = () => {
    onDelete(member);
    onCloseOptions();
  };

  useEffect(() => {
    if (!showOptions) return;

    const handleClickOutside = (event: MouseEvent) => {
      if (
        optionsRef.current &&
        !optionsRef.current.contains(event.target as Node)
      ) {
        onCloseOptions();
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showOptions, onCloseOptions]);

  return (
    <CardWrapper className="relative flex h-full flex-col gap-4 space-y-2 rounded-2xl border border-[#D8DAE5] bg-white p-4 shadow-[0_10px_30px_-24px_rgba(23,36,61,0.55)] transition hover:-translate-y-0.5 hover:shadow-[0_18px_40px_-28px_rgba(23,36,61,0.6)]">
      {canManage && (
        <div
          ref={optionsRef}
          className="absolute right-4 top-4 z-10 flex flex-col items-end"
        >
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onShowOptions();
            }}
            className="cursor-pointer rounded-full border border-[#D8DAE5] bg-white p-1.5 shadow-sm"
            aria-label="Open member actions"
          >
            <img src={ellipse} alt="options" />
          </button>
          {showOptions && (
            <Action
              onDelete={handleDelete}
              onView={() => {
                onCloseOptions();
                navigate(`/home/members/${encodeQuery(member.id)}`);
              }}
              onEdit={() => {
                onCloseOptions();
                navigate(
                  `/home/members/manage-member?member_id=${encodeQuery(member.id)}`,
                );
              }}
            />
          )}
        </div>
      )}

      <div className="flex items-start gap-4 pr-12">
        <ProfilePicture
          className="h-28 w-28 rounded-2xl border border-[#D8DAE5] bg-lightGray/40"
          textClass="font-bold bg-lightGray overflow-hidden opacity-70"
          src={member?.photo}
          alt="profile pic"
          name={member?.name}
        />

        <div className="min-w-0 flex-1 space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <p className="truncate text-lg font-semibold text-primary">
              {member?.name}
            </p>
            
          </div>

          {/* <div className=""> */}
        <div className="flex items-center gap-2 text-sm text-primary">
          <CreditCardIcon className="h-4 w-4 text-primary" />
          <p className="truncate">{memberIdLabel}</p>
        </div>
        <div className="flex items-center gap-2 text-sm text-primary">
          {/* <img src={email} alt="email" /> */}
          <EnvelopeIcon className="h-4 w-4 text-primary" />
          <p className="truncate">{member?.email || "No email"}</p>
        </div>
        <div className="flex items-center gap-2 text-sm text-primary">
          {/* <img src={phone} alt="phone" /> */}
          <PhoneIcon className="h-4 w-4 text-primary" />
          <p className="truncate">{phoneLabel}</p>
        </div>
      </div>


          
        {/* </div> */}
      </div>

      {/* <div className="grid gap-3 rounded-2xl border border-[#ECEEF5] bg-[#FAFBFD] p-3 sm:grid-cols-2">
        <div className="min-w-0">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-primaryGray">
            Department
          </p>
          <p className="mt-1 truncate text-sm font-medium text-primary">
            {departmentLabel}
          </p>
        </div>
        <div className="min-w-0">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-primaryGray">
            Status
          </p>
          <p className="mt-1 truncate text-sm font-medium text-primary">
            {member?.is_active ? "Active profile" : "Inactive profile"}
          </p>
        </div>
      </div> */}
      <div className="mt-3 flex flex-wrap gap-2 text-xs capitalize">
            <span className="rounded-full border border-[#B7E4C1] bg-[#EEF9F1] px-2.5 py-1  font-medium tracking-wide text-[#1E7A3A]">
              {membershipLabel}
            </span>
            <span className="rounded-full border border-[#D7DDEE] bg-[#F7F8FC] px-2.5 py-1  font-medium text-primary">
              {memberRoleLabel}
            </span>
            <span className="rounded-full border border-[#F4D19B] bg-[#FFF5E8] px-2.5 py-1  font-medium  text-[#9A5B09] capitalize">
              {statusLabel}
            </span>
          </div>
      

      <Button
        value="View profile"
        variant="secondary"
        onClick={() => navigate(`/home/members/${encodeQuery(member.id)}`)}
        className="mt-auto w-full border-[#D8DAE5]"
      />
    </CardWrapper>
  );
};
