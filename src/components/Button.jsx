// import { Link } from "react-router-dom";
import PropTypes from 'prop-types';

const  Button = (props)=> {
    const handleClick = (e)=>{
        e.preventDefault();
        props.onClick;
    }
    return (
        <>
            <button className={"leading-5 rounded-md bg-primaryViolet text-center text-black  " + props.className} style={props.style} onClick={handleClick} role='submit button'>{props.value}  </button>
        </>
    )
};

Button.propTypes = {
    link: PropTypes.string,
    value: PropTypes.string.isRequired,
    target: PropTypes.string,
    className: PropTypes.string,
    onClick: PropTypes.func,
    style: PropTypes.object,
    
}

export default Button