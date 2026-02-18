import PropTypes from 'prop-types';
import '../index.css';

const GridWrapper = (props) => {
    return (
        <div className={`grid-wrapper grid grid-cols-1 gap-4 gap-x-4 rounded-xl md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-3 3xl:grid-cols-4 ${props.className}`}>
            {props.children}
        </div>
    );
}

GridWrapper.propTypes = {
    children: PropTypes.node.isRequired,
    className: PropTypes.string,
}

export default GridWrapper;
