import PropTypes from 'prop-types';

const Action = (props) => {
    return (
        <div className="bg-white w-24 p-1 shadow-md rounded-md">
            <ul className=" !divide-lightGray flex flex-col items-start gap-y-2">
                <li onClick={props.onEdit} className="cursor-pointer p-1 w-full hover:bg-lightGray hover:rounded">
                    Edit
                </li>
                <li onClick={props.onView} className="cursor-pointer hover:bg-lightGray hover:rounded">
                    View
                </li>
                <li onClick={props.onDelete} className="cursor-pointer hover:bg-lightGray hover:rounded">
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