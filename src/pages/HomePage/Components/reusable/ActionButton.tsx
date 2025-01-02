import Action from "@/components/Action";
import Elipse from "/src/assets/ellipse.svg";

interface ActionButtonProps {
  showOptions: boolean;
  onDelete: () => void;
  onView: () => void;
  onEdit: () => void;
  hideDelete?: boolean;
}

const ActionButton = (props: ActionButtonProps) => {
  return (
    <>
      <img src={Elipse} alt="options" className="cursor-pointer" />
      {props.showOptions && (
        <Action className="absolute right-0 bottom-50%"
          onDelete={props.onDelete}
          onView={props.onView}
          onEdit={props.onEdit}
          hideDelete={props.hideDelete}
        />
      )}
    </>
  );
};

export default ActionButton;
