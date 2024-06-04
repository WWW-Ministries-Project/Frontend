
import PropTypes from 'prop-types';
import coverImage from "/src/assets/images/CoverImage.jpg";
import Button from '/src/components/Button';
import ProfilePic from "/src/components/ProfilePicture";

const Banner = (props) => {
    const handleClick = () => {
        props.onClick();
    }
    return (
        <div className="w-full relative">
            <img src={coverImage} alt="cover Image" className="w-full h-48" />
            <div className="absolute bottom-0 left-0 w-full h-48 flex items-center justify-between px-2">
                <div className='flex gap-4 items-center'>
                    <ProfilePic className="w-40 h-40 shadow" src={props.src} alt="cover Image" name={props.name} editable={props.edit} />
                    <article>
                        <div>{props.name || "No Name"}</div>
                        <div>{(props.department || "No Department") + " | " + (props.position || "No Position")}</div>
                        <div>{props.email || "No Email" + " | " + props.primary_number || "No Phone"}</div>
                    </article>
                </div>
                <div>
                    <Button value={"Edit Profile"} onClick={handleClick} className="w-full mt-2 p-2 bg-transparent h-8 border " />
                </div>


            </div>
        </div>
    );
}

Banner.propTypes = {
    name: PropTypes.string,
    department: PropTypes.string,
    position: PropTypes.string,
    email: PropTypes.string,
    primary_number: PropTypes.string,
    src: PropTypes.string,
    onClick: PropTypes.func,
    edit: PropTypes.bool

}

export default Banner;
