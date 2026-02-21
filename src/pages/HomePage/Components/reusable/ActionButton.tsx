import Action from "@/components/Action";
import { useRouteAccess } from "@/context/RouteAccessContext";
import Elipse from "/src/assets/ellipse.svg";

interface ActionButtonProps {
  showOptions: boolean;
  onDelete?: () => void;
  onView?: () => void;
  onEdit?: () => void;
  hideDelete?: boolean;
  requireManageAccess?: boolean;
}

const ActionButton = (props: ActionButtonProps) => {
  const { canManageCurrentRoute } = useRouteAccess();
  const requireManageAccess = props.requireManageAccess ?? true;
  const canRunManageActions = !requireManageAccess || canManageCurrentRoute;
  const hasVisibleOptions = Boolean(
    props.onView ||
      (canRunManageActions && (props.onEdit || (props.onDelete && !props.hideDelete)))
  );

  if (!hasVisibleOptions) return null;

  return (
    <>
      <div className="size-5">
        <img src={Elipse} alt="options" className="cursor-pointer" />
      </div>
      {props.showOptions && (
        <Action
          className="absolute right-0 bottom-50%"
          onDelete={props.onDelete}
          onView={props.onView}
          onEdit={props.onEdit}
          hideDelete={props.hideDelete}
          requireManageAccess={requireManageAccess}
        />
      )}
    </>
  );
};

export default ActionButton;
