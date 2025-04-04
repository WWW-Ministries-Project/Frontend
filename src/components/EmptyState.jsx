import empty from "/src/assets/images/empty_state.png";
import PropTypes from 'prop-types';

const EmptyState = (props) => {
    return (
        <div className={`${props.className}`}>
            {/* <h1>EmptyState</h1> */}
            <img src={empty} alt="" />
            <div className={`text-center text-primary my-5 H400`}>{props.msg}</div>
        </div>
    );
}

EmptyState.propTypes = {
    msg: PropTypes.string,
    className: PropTypes.string,


}

export default EmptyState;
