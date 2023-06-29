import { PropTypes } from "prop-types";
import loading from "../assets/images/Loading_2.gif";

const  Loading = (props)=> {
    return (
        <>
            <div className={'flex justify-center '+props.className}> <img src={props.src || loading} alt='loading' className=""/>  </div>
        </>
    )
};

Loading.propTypes = {
    className: PropTypes.string,
    src: PropTypes.string,
}


export default Loading