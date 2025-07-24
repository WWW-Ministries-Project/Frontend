import { EyeIcon, PencilSquareIcon, TrashIcon } from "@heroicons/react/24/outline";
import PropTypes from "prop-types";
import { memo } from "react";

const ActionButton = memo(({ text, onClick }) => {
  // const [hovered, setHovered] = useState(false);
  return (
    <li
      onClick={onClick}
      className={`cursor-pointer flex items-center gap-2 px-4 py-2 w-full text-sm hover:bg-lightGray/30 hover:text-primary`}
    // onMouseOver={() => setHovered(true)}
    // onMouseLeave={() => setHovered(false)}
    >
      {text === "Edit" ? (
        <PencilSquareIcon width={20} />
      ) : text === "View" ? (
        <EyeIcon width={20} />
      ) : (
        <TrashIcon width={20} className="text-red-500" />
      )}
      <span className={`${text === "Delete" ? "text-red-500" : ""}`}>{text}</span>
    </li>
  );
});

ActionButton.displayName = "ActionButton";

const Action = ({ ...props }) => {
  const handleEdit = props.onEdit;
  const handleView = props.onView;
  const handleDelete = props.onDelete;

  return (
    <div
      className={
        "z-10 bg-white divide-gray-100 rounded-lg shadow w-32 border border-[#D8DAE5] " +
        props.className
      }
    >
      <ul className="!divide-lightGray py-2 text-sm text-primary flex flex-col gap-y-1">
        {handleEdit && <ActionButton onClick={handleEdit} text="Edit" />}
        {handleView && <ActionButton onClick={handleView} text="View" />}
        {handleDelete && (
          <>
            <hr className="border-[#D8DAE5]" />
            <ActionButton onClick={handleDelete} text="Delete" />
          </>
        )}
      </ul>
    </div>
  );
};

Action.propTypes = {
  onEdit: PropTypes.func.isRequired,
  onDelete: PropTypes.func.isRequired,
  onView: PropTypes.func,
  hideDelete: PropTypes.bool,
  className: PropTypes.string,
  isEditable: PropTypes.bool,
};

export default Action;
