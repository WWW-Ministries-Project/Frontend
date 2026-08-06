import Action from "@/components/Action";
import { useRouteAccess } from "@/context/RouteAccessContext";
import Elipse from "/src/assets/ellipse.svg";

interface ActionButtonProps {
  showOptions: boolean;
  onDelete?: () => void;
  onView?: () => void;
  onEdit?: () => void;
  onDuplicate?: () => void;
  hideDelete?: boolean;
  requireManageAccess?: boolean;
  requireAdminAccess?: boolean;
}

const ActionButton = (props: ActionButtonProps) => {
  const { canManageCurrentRoute, canAdminCurrentRoute } = useRouteAccess();
  const requireManageAccess = props.requireManageAccess ?? true;
  const requireAdminAccess = props.requireAdminAccess ?? true;
  const canRunManageActions = !requireManageAccess || canManageCurrentRoute;
  const canRunAdminActions = !requireAdminAccess || canAdminCurrentRoute;
  const hasVisibleOptions = Boolean(
    props.onView ||
      (canRunManageActions && props.onEdit) ||
      (canRunManageActions && props.onDuplicate) ||
      (canRunAdminActions && props.onDelete && !props.hideDelete)
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
          onDuplicate={props.onDuplicate}
          hideDelete={props.hideDelete}
          requireManageAccess={requireManageAccess}
          requireAdminAccess={requireAdminAccess}
        />
      )}
    </>
  );
};

export default ActionButton;
