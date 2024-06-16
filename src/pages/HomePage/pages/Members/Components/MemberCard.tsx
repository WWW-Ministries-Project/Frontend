import CardWrapper from '@/Wrappers/CardWrapper';
import ellipse from "@/assets/ellipse.svg";
import Button from '@/components/Button';
import ProfilePic from '@/components/ProfilePicture.jsx';
import { useNavigate } from 'react-router-dom';
import { UserType } from '../utils/membersInterfaces';

interface MemberCardProps {
    name: string;
    position?: string;
    image?: string;
    primary_number?: string;
    id: number;
    department?: string;
    email?: string;
    userInfo: UserType
}

const MemberCard:React.FC<MemberCardProps> = (props) => {
    const navigate = useNavigate();

    return (
        <CardWrapper className="max-w-[400px] min-w-[295px] ">
            <ProfilePic className="w-[7rem] h-[7rem] shadow border border-primaryViolet " src={props.userInfo?.photo} alt="profile pic" />
            <div className="w-full break-all text-xs flex flex-col gap-1 p-1">
                <div className='flex justify-between w-full'>
                    <p className='font-bold text-[1rem] '>{props.name}</p>
                    <img src={ellipse} alt="options" className='w-4 h-4 ' />
                </div> 
                <div className='flex gap-1 my-1'>
                    <p className='text-sm '>{props.department || "Department"}</p> <span>|</span>
                    <p className='text-sm'>Position</p>
                </div>
                <div className='flex gap-1 text-xs'>
                <p className='text-sm '>{props.email|| "email"}</p>
                </div>
                <div>{props.userInfo.primary_number || "Phone Number"}</div>
                <Button value={"View Profile"} onClick={() => {navigate(`/home/members/${props.id}/info`)}} className="w-full mt-2 bg-transparent h-8 border border-primaryViolet " />
            </div>
        </CardWrapper>

    );
}

export default MemberCard;