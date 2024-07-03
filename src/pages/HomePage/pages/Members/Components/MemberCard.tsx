import CardWrapper from '@/Wrappers/CardWrapper';
import ellipse from "@/assets/ellipse.svg";
import Button from '@/components/Button';
import ProfilePic from '@/components/ProfilePicture.jsx';
import { useNavigate } from 'react-router-dom';
import { UserType } from '../utils/membersInterfaces';
import { useUserStore } from '@/store/userStore';

interface MemberCardProps {
    userInfo: UserType
    member: UserType
}

const MemberCard:React.FC<MemberCardProps> = (props) => {
    const navigate = useNavigate();
    const userStore = useUserStore();
    
    const handleClick = () => {
        const temp={
            ...props.userInfo
        }
        userStore.setSelectedMember(temp)
        navigate(`/home/members/${props.member.id}/info`)
    }

    return (
        <CardWrapper className="  rounded-xl ">
            <ProfilePic className="w-[7rem] h-[7rem] shadow border border-primaryViolet " textClass={"font-great-vibes font-bold gradientBtn overflow-hidden opacity-60"} src={props.member?.photo} alt="profile pic" name={props.member?.name} />
            <div className="w-full break-all text-xs flex flex-col gap-1 p-1">
                <div className='flex justify-between w-full '>
                    <p className='font-bold text-[1rem] '>{props.member?.name}</p>
                    {/* <img src={ellipse} alt="options" className='w-4 h-4 ' /> */}
                </div> 
                {/* <div className='flex gap-1 my-1'>
                    <p className='text-sm '>{props.department || "Department"}</p> <span>|</span>
                    <p className='text-sm'>Position</p>
                </div> */}
                <div className='flex gap-1 text-xs'>
                <p className='text-sm '>{props.member?.email|| "email"}</p>
                </div>
                <div>{`${
                props.member?.country_code ? props.member?.country_code : ""
              } ${props.member?.primary_number}`||"Phone Number"}</div>
                <Button value={"View Profile"} onClick={handleClick} className="w-full mt-2 bg-transparent h-8 border border-primaryViolet " />
            </div>
        </CardWrapper>

    );
}

export default MemberCard;
