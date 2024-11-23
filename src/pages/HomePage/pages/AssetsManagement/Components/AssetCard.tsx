import assign from "@/assets/assign.svg";
import calendar from "@/assets/calendar.svg";
import defaultImage1 from "@/assets/image.svg";
import Action from "@/components/Action";
import { formatInputDate } from "@/utils/helperFunctions";
import CardWrapper from "@/Wrappers/CardWrapper";
import PropTypes from "prop-types";
import { assetType } from "../utils/assetsInterface";
import Elipse from "/src/assets/ellipse.svg";
import { useNavigate } from "react-router-dom";

interface IAssetCard {
  onNavigate: (path: string) => void;
  onDelete: (asset: assetType) => void;
  onShowOptions: (id: number | string) => void;
  showOptions: boolean;
  assets: assetType;
}

const AssetCard = (props: IAssetCard) => {
  const navigate = useNavigate();
  const handleNavigation = (path: string) => {
    alert(path);
    // navigate(path);
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    props.onDelete(props.assets);
  };
  const handleShowOptions = (e: React.MouseEvent) => {
    e.stopPropagation();
    props.onShowOptions(props.assets.id);
  };
  return (
    <div
      className={`rounded-xl pb-1 ${
        props.assets.department_assigned ? "bg-primaryViolet" : "bg-mainGray"
      } `}
    >
      <CardWrapper
        className={
          "text-gray gap-2 pb-2 flex flex-col rounded-xl relative border border-lightGray"
        }
      >
        <div className={`rounded-xl bg-[#00000050] `}>
          {/* <div
          className={`rounded-xl bg-[#00000050] border-b border-b-4 ${props.assets.department_assigned?"border-b-primaryViolet" : "border-b-mainGray" } `}
        > */}
          <img
            className="max-w-[70vw] rounded-xl w-full h-32"
            src={props.assets.photo || defaultImage1}
            alt="poster for assets"
          />
        </div>
        <div
          className="flex px-3 gap-1 items-center font-bold cursor-pointer"
          onClick={() =>
            handleNavigation(
              `/home/events/view-assets?event_id=${props.assets.id}`
            )
          }
        >
          <p>{props.assets.name}</p>
        </div>
        <div className="flex px-3 gap-1 items-center text-sm">
          <img src={calendar} alt="clock icon" />
          <p>{formatInputDate(props.assets.date_purchased)}</p>
        </div>
        <div className="flex px-3 gap-1 text-sm">
          <img src={assign} alt="assigned to icon" />
          <p>{props.assets.department_assigned || "Unassigned"}</p>
        </div>
        <div
          className={`absolute right-0 flex flex-col items-end m-4 rounded-md w-1/4 text-center`}
          onClick={handleShowOptions}
        >
          <img src={Elipse} alt="options" className="cursor-pointer" />
          {props.showOptions && (
            <Action
              onDelete={handleDelete}
              onView={() =>
                handleNavigation(
                  `/home/events/view-assets?event_id=${props.assets.id}`
                )
              }
              onEdit={() =>
                handleNavigation(
                  `/home/manage-assets?event_id=${props.assets.id}`
                )
              }
            />
          )}
        </div>
      </CardWrapper>
    </div>
  );
};

AssetCard.propTypes = {
  className: PropTypes.string,
  assets: PropTypes.shape({
    name: PropTypes.string,
    date_purchased: PropTypes.string,
    photo: PropTypes.string,
    description: PropTypes.string,
    id: PropTypes.number,
    status: PropTypes.string,
  }),
};

export default AssetCard;
