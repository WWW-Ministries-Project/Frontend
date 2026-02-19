import CardWrapper from "@/Wrappers/CardWrapper";
import ellipse from "@/assets/ellipse.svg";
import email from "@/assets/email.svg";
import phone from "@/assets/phone.svg";
import { Button, ProfilePicture } from "@/components";
import Action from "@/components/Action";
import { encodeQuery } from "@/pages/HomePage/utils";
import { MembersType } from "@/utils";
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
  const { member, showOptions, onShowOptions, onCloseOptions, onDelete, canManage } =
    props;
  const navigate = useNavigate();
  const optionsRef = useRef<HTMLDivElement | null>(null);

  const handleClick = (path: string, mode?: "edit") => {
    if (mode) navigate(path);
    else navigate(path, { state: { mode } });
  };

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
    <CardWrapper className=" grid grid-cols-4  gap-x-1 p-3 rounded-xl border border-[#D8DAE5] ">
      <ProfilePicture
        className="w-[6rem] h-[6rem] md:w-16 md:h-16 lg:w-20 lg:h-20  border border-[#D8DAE5] "
        textClass={" font-bold bg-lightGray overflow-hidden opacity-70"}
        src={member?.photo}
        alt="profile pic"
        name={member?.name}
      />
      <div className="col-span-3 relative w-full break-all text-xs flex flex-col gap-1 p-1">
        <div className="space-y-5">
          <div>
            <div className="">
              {canManage && (
                <div
                  ref={optionsRef}
                  className={`absolute right-0 top-0 flex flex-col items-end  rounded-md w-1/4 `}
                >
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onShowOptions();
                    }}
                    className="cursor-pointer"
                    aria-label="Open member actions"
                  >
                    <img src={ellipse} alt="options" />
                  </button>
                  {showOptions && (
                    <Action
                      onDelete={handleDelete}
                      onView={() => {
                        onCloseOptions();
                        handleClick(
                          `/home/members/${encodeQuery(member.id)}`
                        );
                      }}
                      onEdit={() => {
                        onCloseOptions();
                        handleClick(
                          `/home/members/manage-member?member_id=${encodeQuery(
                            member.id
                          )}`,
                          "edit"
                        );
                      }}
                    />
                  )}
                </div>
              )}
              <div className="flex  w-4/5">
                  <p className="font-bold text-[1rem] truncate text-primary">
                  {member?.name}
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex gap-1.5 text-sm text-primary ">
              <img src={email} alt="options" className="" />
              <p className="text truncate ">
                {member?.email || "No email"}
              </p>
            </div>
            <div className="flex gap-1.5 text-sm text-primary">
              <img src={phone} alt="options" className="" />
              <p className="text truncate ">
                {`${
                  member?.country_code ? member?.country_code : ""
                } ${
                  member?.primary_number
                    ? member?.primary_number
                    : "No phone number"
                }`}
              </p>
            </div>
          </div>
        </div>

        <Button
          value={"View "}
          onClick={() =>
            handleClick(`/home/members/${encodeQuery(member.id)}`)
          }
          className="w-full mt-2 bg-transparent text-sm p-2.5 border border-[#D8DAE5] text-primary"
        />
      </div>
    </CardWrapper>
  );
};
