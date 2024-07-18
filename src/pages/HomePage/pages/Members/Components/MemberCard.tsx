// @ts-nocheck
import CardWrapper from "@/Wrappers/CardWrapper";
import ellipse from "@/assets/ellipse.svg";
import Action from "@/components/Action";
import Button from "@/components/Button";
import ProfilePic from "@/components/ProfilePicture.jsx";
import { useUserStore } from "@/store/userStore";
import { useNavigate } from "react-router-dom";
import { UserType } from "../utils/membersInterfaces";

interface MemberCardProps {
  userInfo: UserType;
  member: UserType;
  showOptions: boolean;
  onDelete: () => void;
}

const MemberCard: React.FC<MemberCardProps> = (props) => {
  const navigate = useNavigate();
  const userStore = useUserStore();

  const handleClick = () => {
    const temp = {
      ...props.userInfo,
    };
    userStore.setSelectedMember(temp);
    navigate(`/home/members/${props.member.id}/info`);
  };

  const handleDelete = () => {
    props.onDelete(props.member);
  };
  return (
    <CardWrapper className=" flex p-3 rounded-xl ">
      <ProfilePic
        className="w-[7rem] h-[7rem] shadow border border-primaryViolet "
        textClass={
          "font-great-vibes font-bold gradientBtn overflow-hidden opacity-60"
        }
        src={props.member?.photo}
        alt="profile pic"
        name={props.member?.name}
      />
      <div className="relative w-full break-all text-xs flex flex-col gap-1 p-1">
        <div
          className={`absolute right-0 top-0 flex flex-col items-end rounded-md w-1/4 text-center`}
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
        <div className="flex justify-between w-full ">
          <p className="font-bold text-[1rem] ">{props.member?.name}</p>
          {/* <img src={ellipse} alt="options" className='w-4 h-4 ' /> */}
        </div>
        {/* <div className='flex gap-1 my-1'>
                    <p className='text-sm '>{props.department || "Department"}</p> <span>|</span>
                    <p className='text-sm'>Position</p>
                </div> */}
        <div className="flex gap-1 text-xs">
          <p className="text-sm ">{props.member?.email || "email"}</p>
        </div>
        <div>
          {`${props.member?.country_code ? props.member?.country_code : ""} ${
            props.member?.primary_number
          }` || "Phone Number"}
        </div>
        <Button
          value={"View Profile"}
          onClick={handleClick}
          className="w-full mt-2 bg-transparent h-8 border border-primaryViolet "
        />
      </div>
    </CardWrapper>
  );
};

export default MemberCard;
