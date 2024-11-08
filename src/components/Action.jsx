import PropTypes from 'prop-types';

const Action = (props) => {
    return (
        <div className="z-10 bg-white divide-gray-100 rounded-lg shadow w-32 border border-[#D8DAE5]">
            <ul className=" !divide-lightGray py-2 text-sm text-dark900 flex flex-col  gap-y-2">
                <li onClick={props.onEdit} className="cursor-pointer block px-4 py-2 w-full hover:bg-lightGray hover:rounded">
                    Edit
                </li>
                <li onClick={props.onView} className="cursor-pointer block px-4 py-2 w-full hover:bg-lightGray hover:rounded">
                    View
                </li>
                <hr className='border-[#D8DAE5]'/>
                <li onClick={props.onDelete} className="cursor-pointer block px-4 py-2 w-full hover:bg-lightGray hover:rounded">
                    Delete
                </li>
            </ul>
        </div>
    );
}

Action.propTypes = {
    onEdit: PropTypes.func.isRequired,
    onDelete: PropTypes.func.isRequired,
    onView: PropTypes.func.isRequired,
}

export default Action;