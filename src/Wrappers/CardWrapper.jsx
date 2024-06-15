import PropTypes from 'prop-types';

const CardWrappers = (props) => {
    return (
        <div className={"w-full max-w-[400px] min-w-[295px]  p-3 flex gap-3 text-darkGray rounded-xl shadow-sm border-1 bg-white "+props.className}>
            {props.children}
        </div>
    );
}

CardWrappers.propTypes = {
    className: PropTypes.string,
    children: PropTypes.node
}

export default CardWrappers;
