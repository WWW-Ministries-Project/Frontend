import PropTypes from 'prop-types';
import { firstLetters } from '/src/utils/helperFunctions';
import icon from '/src/assets/edit-2.svg'



const  ProfilePic = (props)=> {

    // function handleClick() {
    //     props.onClick()
    // }
    
    function handlePicChange(event){        
        var picture = event.currentTarget.files[0];
        var src     = URL.createObjectURL(picture);
        const obj = {
            picture: picture,
            src: src
        }
       props.onChange(obj)
    }
    

    return (
        <>
             <div className="flex">
                <div className={'rounded-[50%]  relative  '+props.className}>
                    {props.src ? <img src={ props.src} alt={props.alt} className='w-full rounded-full h-full' id="profile" /> : 
                    <div className={'w-full rounded-full h-full flex justify-center items-center '+ props.textClass}>{firstLetters(props.name)}</div>}
                    {props.editable? <label className="absolute left-2/3 bottom-0 cursor-pointer " htmlFor={props.id}>
                    <span><img src={props.icon || icon} alt="" /></span>
                </label>: null}
                    {/* {props.editable? <label className=" absolute top-0 z-2 rounded-full w-full h-full flex justify-center items-center text-sm bg-blur cursor-pointer text-white" htmlFor={props.id}>
                    <span>Change Image</span>
                </label>: null} */}
                <input  type="file" id={props.id} className='hidden' onChange={props.onChange && handlePicChange} accept="image/*" capture='user'/>
                </div>
                
            </div>
        </>
    )
};

ProfilePic.propTypes = {
    text: PropTypes.string,
    className: PropTypes.string,
    textClass: PropTypes.string,
    src: PropTypes.string,    
    alt: PropTypes.string.isRequired,  
    icon: PropTypes.string,    
    id: PropTypes.string,
    name: PropTypes.string,
    onClick: PropTypes.func, 
    onChange: PropTypes.func,
    editable: PropTypes.bool, 
}

export default ProfilePic