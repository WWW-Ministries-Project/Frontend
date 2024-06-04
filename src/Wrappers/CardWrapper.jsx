import PropTypes from 'prop-types';

const CardWrappers = (props) => {
    return (
        <div className={"max-w-[300px] min-w-[250px] p-3 flex gap-3 text-darkGray rounded shadow-md border-1 bg-white "+props.className}>
            {props.children}
        </div>
    );
}

CardWrappers.propTypes = {
    className: PropTypes.string,
    children: PropTypes.node
}

export default CardWrappers;
