import PropTypes from 'prop-types';
import '../index.css';

const GridWrapper = (props) => {
    return (
        <div className={` hideScrollbar 2xl:h-[80vh] lg:h-[80vh] md:h-[78vh]  xs:h-[72vh]  grid-wrapper overflow-y-auto gap-4 grid 2xl:grid-cols-4 xl:grid-cols-3 lg:grid-cols-2 md:grid-cols-2 grid-cols-1 gap-x-4 rounded-xl ${props.className}`}>
            {props.children}
        </div>
    );
}

GridWrapper.propTypes = {
    children: PropTypes.node.isRequired,
    className: PropTypes.string,
}

export default GridWrapper;
