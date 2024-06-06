import PropTypes from 'prop-types';
const GridWrapper = (props) => {
    return (
        <div className={"w-full grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 justify-center "+props.className }>
            {props.children}
        </div>
    );
}

GridWrapper.propTypes = {
    children: PropTypes.node.isRequired,
    className: PropTypes.string,
}

export default GridWrapper;
