import DeleteIcon from "@/assets/DeleteIcon";
import EditIcon from "@/assets/EditIcon";
import ViewIcon from "@/assets/ViewIcon";
import PropTypes from "prop-types";
import React, { useState } from "react";

const ActionButton = React.memo(({ text, onClick }) => {
  const [hovered, setHovered] = useState(false);
  return (
    <li
      onClick={onClick}
      className={`cursor-pointer flex items-center gap-2 px-4 py-2 w-full text-base hover:bg-[#E0D7F3] hover:text-primaryViolet`}
      onMouseOver={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {text === "Edit" ? (
        <EditIcon fill={hovered && "#6539c3"} />
      ) : text === "View" ? (
        <ViewIcon fill={hovered && "#6539c3"} />
      ) : (
        <DeleteIcon fill={hovered && "#6539c3"} />
      )}
      <span>{text}</span>
    </li>
  );
});

const Action = (props) => {
  const handleEdit = () => props.onEdit();
  const handleView = () => props.onView();
  const handleDelete = () => props.onDelete();


  return (
    <div className={"z-10 bg-white divide-gray-100 rounded-lg shadow w-32 border border-[#D8DAE5] " + props.className}>
      <ul className="!divide-lightGray py-2 text-sm text-dark900 flex flex-col gap-y-2">
        <ActionButton onClick={handleEdit} text="Edit" />
        <ActionButton onClick={handleView} text="View" />
        {!props.hideDelete && <>
          <hr className="border-[#D8DAE5]" />
          <ActionButton onClick={handleDelete} text="Delete" /></>}
      </ul>
    </div>
  );
};

Action.propTypes = {
  onEdit: PropTypes.func.isRequired,
  onDelete: PropTypes.func.isRequired,
  onView: PropTypes.func.isRequired,
  hideDelete: PropTypes.bool,
  className: PropTypes.string
};

export default Action;
