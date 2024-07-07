import empty from "/src/assets/images/empty_state.png";
import PropTypes from 'prop-types';

const EmptyState = (props) => {
    return (
        <div>
            {/* <h1>EmptyState</h1> */}
            <img src={empty} alt="" />
            <p className="text-center text-mainGray my-5 H400">{props.msg}</p>
        </div>
    );
}

EmptyState.propTypes = {
    msg: PropTypes.string,

}

export default EmptyState;
