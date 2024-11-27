import assign from "@/assets/assign.svg";
import calendar from "@/assets/calendar.svg";
import defaultImage1 from "@/assets/image.svg";
import Action from "@/components/Action";
import { useStore } from "@/store/useStore";
import { formatInputDate } from "@/utils/helperFunctions";
import CardWrapper from "@/Wrappers/CardWrapper";
import PropTypes from "prop-types";
import { useNavigate } from "react-router-dom";
import { assetType } from "../utils/assetsInterface";
import Elipse from "/src/assets/ellipse.svg";

interface IAssetCard {
  onDelete: (asset: assetType) => void;
  onShowOptions: (id: number | string) => void;
  showOptions: boolean;
  assets: assetType;
}

const AssetCard = (props: IAssetCard) => {
  const navigate = useNavigate();
  const handleAction = (path: string) => {
    useStore.getState().setActiveAsset(props.assets);
    navigate(path);
  };

  const handleDelete = () => {
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
          <img
            className=" rounded-xl w-full h-48 object-cover"
            src={props.assets.photo || defaultImage1}
            alt="poster for assets"
          />
        </div>
        <div
          className="flex px-3 gap-1 items-center font-bold cursor-pointer"
          onClick={() =>
            handleAction(
              `/home/Assets/manage-asset?asset_id=${props.assets.id}`
            )
          }
        >
          <p>{props.assets.name}</p>
        </div>
        <div className="flex px-3 gap-1 items-center text-sm">
          <img src={calendar} alt="clock icon" />
          <p>{formatInputDate(props.assets.date_purchased)|| "Unknown"}</p>
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
                handleAction(
                  `/home/assets/view-assets?asset_id=${props.assets.id}`
                )
              }
              onEdit={() =>
                handleAction(
                  `/home/Assets/manage-asset?asset_id=${props.assets.id}`
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
