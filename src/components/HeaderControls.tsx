import FilterIcon from "@/assets/FilterIcon";
import GridAsset from "@/assets/GridAsset";
import SearchIcon from "@/assets/SearchIcon";
import TableAsset from "@/assets/TableAssets";
import { Button } from "@/components";
import { cn } from "@/utils/cn";
import { ReactNode } from "react";

//TODO
interface IProps {
  title: string;
  tableView?: boolean;
  handleViewMode?: (isTableView: boolean) => void;
  showFilter?: boolean;
  setShowFilter?: (show: boolean) => void;
  showSearch?: boolean;
  setShowSearch?: (show: boolean) => void;
  handleClick?: () => void;
  screenWidth?: number;
  btnName?: string;
  hasFilter?: boolean;
  hasSearch?: boolean;
  subtitle?: string;
  customIcon?: ReactNode;
}

export const HeaderControls = ({
  title,
  tableView,
  handleViewMode,
  showFilter,
  setShowFilter,
  showSearch,
  setShowSearch,
  handleClick,
  screenWidth = 0,
  btnName,
  hasSearch = false,
  hasFilter = false,
  subtitle,
  customIcon,
}: IProps) => {
  return (
    <div className="flex justify-between items-center mb-4 overflow-x-auto">
      {/* Title with total members */}
      <div className="space-y-1">
        <p className="text-primary text-xl md:text-2xl font-semibold">
          {title}
        </p>
        {subtitle && <p>{subtitle}</p>}
      </div>

      {/* Controls Section */}
      <div className="flex justify-between items-center">
        <div className="flex justify-start gap-2 items-center w-2/3">
          {/* View Mode Switch */}
          <div className="flex gap-2 items-center">
            {handleViewMode && (
              <div
                className="flex gap-1 bg-lightGray p-1 rounded-md cursor-pointer"
                id="switch"
              >
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
              </div>
            )}
            {/* Filter & Search Buttons */}
            {hasFilter && (
              <FilterIcon
                className="cursor-pointer w-10 h-10 flex items-center justify-center border border-lightGray rounded-md"
                onClick={() => setShowFilter && setShowFilter(!showFilter)}
              />
            )}
            {hasSearch && (
              <SearchIcon
                className="cursor-pointer w-10 h-10 flex items-center justify-center border border-lightGray rounded-md"
                onClick={() => setShowSearch && setShowSearch(!showSearch)}
              />
            )}
          </div>
          {customIcon ?? null}
          {/* Add Member Button */}
          {btnName && (
            <Button
              value={screenWidth <= 700 ? "+" : btnName}
              className={cn(
                "text-white min-h-12 max-h-14 bg-primary whitespace-nowrap",
                screenWidth <= 540 ? "px-3" : "px-5"
              )}
              onClick={handleClick}
            />
          )}
        </div>
      </div>
    </div>
  );
};
