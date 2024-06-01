import ProfilePic from '/src/components/ProfilePicture';
import ellipse from "/src/assets/ellipse.svg";
import Button from '/src/components/Button';
import PropTypes from 'prop-types';

const MemberCard = (props) => {
    return (
        <div className="max-w-[300px] min-w-[250px] p-3 flex gap-3 text-darkGray rounded shadow-md border-1 bg-white">
            <ProfilePic className="w-20 h-20 shadow" src={props.userInfo.photo} />
            <div className="w-full text-xs flex flex-col gap-1">
                <div className='flex justify-between w-full'>
                    <p className='font-bold text-sm'>{props.name}</p>
                    <img src={ellipse} alt="options" className='w-3 h-3 ' />
                </div> 
                <div className='flex gap-1'>
                    <p className='text-xs '>{props.department}</p>
                    <p className='text-xs '>Position</p>
                </div>
                <div className='flex gap-1 text-xs'>
                    {props.email}
                </div>
                <div>{props.userInfo.primary_number}</div>
                <Button value={"View Profile"} className="w-full mt-2 bg-transparent h-8 border "/>
            </div>
        </div>
    );
}
MemberCard.propTypes = {
    name: PropTypes.string,
    email: PropTypes.string,
    department: PropTypes.string,
    image: PropTypes.string,
    position: PropTypes.string,
    userInfo: PropTypes.object,
}

export default MemberCard;
