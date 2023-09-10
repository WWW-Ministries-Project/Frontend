import React from "react";
import PropTypes from 'prop-types';

const  ImageInput = (props)=> {

    function handleChange(event){
        var picture = event.currentTarget.files[0];
        var src     = URL.createObjectURL(picture);
        const id = event.currentTarget.parentNode.firstChild.id;
        const obj = {
            picture: picture,
            src: src
        }
        props.onChange(obj,id)
    }

    return (       
        <>
           <label style={props.labelVisible ? {} : {display:'none'}} className=" absolute top-0 z-2 w-full h-full flex justify-center items-center text-3xl bg-blur cursor-pointer text-white" htmlFor={props.id}>
                    <span className="fa fa-camera m-2"></span>
                    <span>Change Image</span>
                </label>
                <input id={props.id} type="file" accept="image/*" onChange={handleChange} className='hidden'/> 
        </>
    )
};

ImageInput.propTypes = {
    // className: PropTypes.string,       
    id: PropTypes.string.isRequired, 
    labelVisible: PropTypes.bool,   
    onChange: PropTypes.func,   
}

export default ImageInput