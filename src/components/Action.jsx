import PropTypes from 'prop-types';

const Action = (props) => {
    return (
        <div className="bg-white w-24 p-2 shadow-md rounded-md">
            <ul className="divide-y divide-gray-300 flex flex-col gap-y-2">
                <li onClick={props.onEdit} className="cursor-pointer">
                    Edit
                </li>
                <li onClick={props.onView} className="cursor-pointer">
                    View
                </li>
                <li onClick={props.onDelete} className="cursor-pointer">
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