import PropTypes from 'prop-types';

const CardWrappers = (props) => {
    return (
        <div className={"w-full    gap-1 text-darkGray   border-1 bg-white "+ props.className}>
            {props.children}
        </div>
    );
}

CardWrappers.propTypes = {
    className: PropTypes.string,
    children: PropTypes.node
}

export default CardWrappers;
