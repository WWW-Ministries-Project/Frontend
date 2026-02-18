import PropTypes from 'prop-types';

const CardWrappers = (props) => {
    return (
        <div className={"app-card w-full gap-1 text-darkGray " + props.className}>
            {props.children}
        </div>
    );
}

CardWrappers.propTypes = {
    className: PropTypes.string,
    children: PropTypes.node
}

export default CardWrappers;
