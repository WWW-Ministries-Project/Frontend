import assign from "@/assets/assign.svg";
import calendar from "@/assets/calendar.svg";
import defaultImage1 from "@/assets/image.svg";
import CardWrapper from "@/Wrappers/CardWrapper";
import PropTypes from "prop-types";

const AssetCard = (props: any) => {
  return (
    <div className="authForm bg-white cursor-pointer rounded-xl border border-[#D8DAE5] hover:shadow-lg mx-auto border-b-[#6539C3] border-b-4">
      <div className="relative top">
        <div
          className={`absolute ${
            props.assets.photo ? "" : "bg-[#00000050]"
          } border-b border-[#D8DAE5] w-full h-[23vh] rounded-xl`}
        ></div>
        <div
          className={`text-xs absolute right-0 m-4 rounded-md text-lighterBlac w-1/4 text-center ${
            props.assets.status === "ASSIGNED"
              ? "bg-green "
              : "bg-neutralGray text-lighterBlack"
          }`}
        >
          {props.assets.status === "ASSIGNED" ? "Assigned" : "Unassigned"}
        </div>

        <img
          className="rounded-xl w-[70vw] h-[23vh]"
          src={props.assets.photo || defaultImage1}
          alt="lk"
        />
      </div>
      {/* <div className='pb-1 rounded-xl bg-primaryViolet'> */}
      <CardWrapper className={"flex-col text-gray rounded-b-xl p-3 flex "}>
        <div className="flex  gap-y-2 gap-x-1 items-center ">
          <p className="font-bold">{props.assets.name}</p>
        </div>
        <div className="flex  gap-y-2 gap-x-1 items-center ">
          {/* <p className='font-bold'>Status:</p><p>{props.assets.status=== "ASSIGNED" ? "Assigned" : "Unassigned"}</p> */}
        </div>
        <div className="flex  gap-y-2 gap-x-1 items-center ">
          <img src={assign} alt="clock icon" />
          {
            <div className="flex gap-x-1">
              {" "}
              <p className="">
                <span className="text-sm">
                  {props.assets.department_assigned}
                </span>
              </p>{" "}
            </div>
          }
        </div>

        <div className="flex gap-1 text-sm">
          <img src={calendar} alt="clock icon" />
          <p>
            <span className="text-sm">{props.assets.date_purchased}</span>
            <span className="text-sm">- {props.assets.end_time} (GMT)</span>
          </p>
        </div>
        <div className="flex gap-1 items-center text-sm">
        </div>
        <div className="flex gap-1 text-sm">
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