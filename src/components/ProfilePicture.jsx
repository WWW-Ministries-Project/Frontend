import React from "react";
import PropTypes from 'prop-types';
import pic from "/assets/home/profile-circle.svg";


const  ProfilePic = (props)=> {

    function handleClick() {
        props.onClick()
    }
    
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
                <div className={'rounded-[50%]  relative '+props.className}>
                    <img src={ props.src ? props.src : pic} alt={props.alt} className='w-full rounded-full h-full' id="profile" />
                    <label className=" absolute top-0 z-2 rounded-full w-full h-full flex justify-center items-center text-sm bg-blur cursor-pointer text-white" htmlFor={props.id}>
                    {/* <span className="fa fa-camera m-2"></span> */}
                    <span>Change Image</span>
                </label>
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
    icon: PropTypes.string.isRequired,    
    id: PropTypes.string,
    name: PropTypes.string,
    alternative: PropTypes.string.isRequired,
    onCliick: PropTypes.func, 
    onChange: PropTypes.func, 
}

export default ProfilePic