import PropTypes from 'prop-types';
import '../index.css';

const GridWrapper = (props) => {
    return (
        <div className={`grid-wrapper hideScrollbar ${props.className}`}>
            {props.children}
        </div>
    );
}

GridWrapper.propTypes = {
    children: PropTypes.node.isRequired,
    className: PropTypes.string,
}

export default GridWrapper;
