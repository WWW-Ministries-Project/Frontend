import PropTypes from 'prop-types';
import '../index.css';

const GridWrapper = (props) => {
    return (
        <div className={`grid-wrapper hideScrollbar grid 2xl:grid-cols-4 xl:grid-cols-3 lg:grid-cols-2 md:grid grid-cols-1 gap-x-4 rounded-xl ${props.className}`}>
            {props.children}
        </div>
    );
}

GridWrapper.propTypes = {
    children: PropTypes.node.isRequired,
    className: PropTypes.string,
}

export default GridWrapper;
