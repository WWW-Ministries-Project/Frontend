import React from "react";
import PropTypes from "prop-types";
import TableAsset from "@/assets/TableAssets"; // Corrected import path
import GridAsset from "@/assets/GridAsset";
import FilterIcon from "@/assets/FilterIcon";
import SearchIcon from "@/assets/SearchIcon";
import Button from "@/components/Button";

interface HeaderControlsProps {
  title: string;
  totalMembers?: number;
  tableView: boolean;
  handleViewMode: (isTableView: boolean) => void;
  showFilter: boolean;
  setShowFilter: (show: boolean) => void;
  showSearch: boolean;
  setShowSearch: (show: boolean) => void;
  handleNavigation: () => void;
  screenWidth: number;
  btnName: string; // Added btnName property
  Filter?: boolean; // Added hideFilter property
  Search?: boolean; // Added hideSearch property
  Grid?: boolean; // Added Grid property
}

const HeaderControls: React.FC<HeaderControlsProps> = ({
  title,
  totalMembers,
  tableView,
  handleViewMode,
  showFilter,
  setShowFilter,
  showSearch,
  setShowSearch,
  handleNavigation,
  screenWidth,
  btnName,
  Search = true,
  Filter = true,
  Grid = true,
}) => {
  return (
    <div className="flex justify-between items-center mb-4">
      {/* Title with total members */}
      <p className="text-dark900 text-2xl font-semibold">
        {title} ({totalMembers || "-"})
      </p>

      {/* Controls Section */}
      <div className="flex justify-between items-center">
        <div className="flex justify-start gap-2 items-center w-2/3">
          {/* View Mode Switch */}
          <div className="flex gap-2 items-center">
            {Grid&&<div className="flex gap-1 bg-lightGray p-1 rounded-md cursor-pointer" id="switch">
              <div onClick={() => handleViewMode(true)}>
                <TableAsset
                  stroke={tableView ? "#8F95B2" : "#8F95B2"}
                  className={tableView ? "bg-white rounded-md" : ""}
                />
              </div>
              <div onClick={() => handleViewMode(false)}>
                <GridAsset
                  stroke={tableView ? "#8F95B2" : "#8F95B2"}
                  className={
                    tableView
                      ? "bg-lightGray rounded-md"
                      : "bg-white  rounded-md"
                  }
                />
              </div>
            </div>}
            {/* Filter & Search Buttons */}
            {Filter&&<FilterIcon
              className="cursor-pointer w-10 h-10 flex items-center justify-center border border-lightGray rounded-md"
              onClick={() => setShowFilter(!showFilter)}
            />}
            {Search&&<SearchIcon
              className="cursor-pointer w-10 h-10 flex items-center justify-center border border-lightGray rounded-md"
              onClick={() => setShowSearch(!showSearch)}
            />}
          </div>
          {/* Add Member Button */}
          {btnName&&<Button
            value={screenWidth <= 700 ? "+" : btnName}
            className={
              "text-white px-5 min-h-12 max-h-14 p-3 bg-primaryViolet whitespace-nowrap" +
              (screenWidth <= 540 ? " w-12 px-3" : "")
            }
            onClick={handleNavigation}
          />}
        </div>
      </div>
    </div>
  );
};

// Define PropTypes
HeaderControls.propTypes = {
  title: PropTypes.string.isRequired,
  totalMembers: PropTypes.number,
  tableView: PropTypes.bool.isRequired,
  handleViewMode: PropTypes.func.isRequired,
  showFilter: PropTypes.bool.isRequired,
  setShowFilter: PropTypes.func.isRequired,
  showSearch: PropTypes.bool.isRequired,
  setShowSearch: PropTypes.func.isRequired,
  handleNavigation: PropTypes.func.isRequired,
  screenWidth: PropTypes.number.isRequired,
};

export default HeaderControls;
