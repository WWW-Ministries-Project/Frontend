import PropTypes from 'prop-types';
const GridWrapper = (props) => {
    return (
        <div className={
            `overflow-y-auto overflow-x-hidden xl:h-[80vh] lg:h-[73vh]   grid gap-5 justify-center grid-cols-1 min-[710px]:grid-cols-2 tablet:gap-4 laptop:grid-cols-3 desktop:grid-cols-4 min-[1284px]:grid-cols-4` 
            +props.className }>
            {props.children}
        </div>

    );
}

GridWrapper.propTypes = {
    children: PropTypes.node.isRequired,
    className: PropTypes.string,
}

export default GridWrapper;
