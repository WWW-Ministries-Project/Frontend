import CardWrapper from "@/Wrappers/CardWrapper";
import ellipse from "@/assets/ellipse.svg";
import email from "@/assets/email.svg";
import phone from "@/assets/phone.svg";
import Action from "@/components/Action";
import Button from "@/components/Button";
import ProfilePic from "@/components/ProfilePicture.jsx";
import { useUserStore } from "@/store/userStore";
import { useNavigate } from "react-router-dom";
import { UserType } from "../utils/membersInterfaces";

interface MemberCardProps {
  // userInfo: UserType;
  member: UserType;
  showOptions: boolean;
  onShowOptions: () => void;
  onDelete: (val?: UserType) => void;
}

const MemberCard: React.FC<MemberCardProps> = (props) => {
  const navigate = useNavigate();
  const userStore = useUserStore();

  const handleClick = () => {
    const temp = {
      ...props.member,
    };
    userStore.setSelectedMember(temp);
    navigate(`/home/members/${props.member.id}/info`);
  };

  const handleDelete = () => {
    props.onDelete(props.member);
  };
  return (
    <CardWrapper className=" grid grid-cols-4 flex gap-x-1 p-3 rounded-xl border border-[#D8DAE5] ">
      <ProfilePic
        className="w-[6rem] h-[6rem]  border border-[#D8DAE5] "
        textClass={" font-bold bg-lightGray overflow-hidden opacity-70"}
        src={props.member?.photo}
        alt="profile pic"
        name={props.member?.name}
      />
      <div className="col-span-3 relative w-full break-all text-xs flex flex-col gap-1 p-1">
        <div className="space-y-5">
          <div>
            <div className="">
              <div
                className={`absolute right-0 top-0 flex flex-col items-end  rounded-md w-1/4 `}
                onClick={props.onShowOptions}
              >
                <img src={ellipse} alt="options" className="cursor-pointer" />
                {props.showOptions && (
                  <Action
                    onDelete={handleDelete}
                    onView={handleClick}
                    onEdit={handleClick}
                  />
                )}
              </div>
              <div className="flex  w-4/5">
                <p className="font-bold text-[1rem] truncate text-dark900">
                  {props.member?.name}
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex gap-1.5 text-sm text-dark900 ">
              <img src={email} alt="options" className="" />
              <p className="text truncate ">
                {props.member?.email || "No email"}
              </p>
            </div>
            <div className="flex gap-1.5 text-sm text-dark900">
              <img src={phone} alt="options" className="" />
              <p className="text truncate ">
                {`${
                  props.member?.country_code ? props.member?.country_code : ""
                } ${
                  props.member?.primary_number
                    ? props.member?.primary_number
                    : "No phone number"
                }`}
              </p>
            </div>
          </div>
        </div>

        <Button
          value={"View "}
          onClick={handleClick}
          className="w-full mt-2 bg-transparent text-sm p-2.5 border border-[#D8DAE5] text-dark900"
        />
      </div>
    </CardWrapper>
  );
};

export default MemberCard;
