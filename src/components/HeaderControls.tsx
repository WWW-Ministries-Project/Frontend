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
    <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
      <div className="min-w-0 space-y-1">
        <h1 className="truncate text-xl font-semibold text-primary md:text-2xl">
          {title}
        </h1>
        {subtitle && <p className="text-sm text-primaryGray md:text-base">{subtitle}</p>}
      </div>

      <div className="flex flex-wrap items-center gap-2 md:justify-end">
        {handleViewMode && (
          <div
            className="flex items-center gap-1 rounded-lg border border-lightGray bg-lightGray/30 p-1"
            id="switch"
          >
            <button
              type="button"
              onClick={() => handleViewMode(true)}
              className={cn(
                "rounded-md p-1 transition-colors",
                tableView ? "bg-white shadow-sm" : "hover:bg-white/70"
              )}
              aria-label="Switch to table view"
            >
              <TableAsset stroke="#8F95B2" />
            </button>

            <button
              type="button"
              onClick={() => handleViewMode(false)}
              className={cn(
                "rounded-md p-1 transition-colors",
                !tableView ? "bg-white shadow-sm" : "hover:bg-white/70"
              )}
              aria-label="Switch to grid view"
            >
              <GridAsset stroke="#8F95B2" />
            </button>
          </div>
        )}

        {hasFilter && (
          <FilterIcon
            className="cursor-pointer flex h-10 w-10 items-center justify-center rounded-lg border border-lightGray"
            onClick={() => setShowFilter && setShowFilter(!showFilter)}
          />
        )}

        {hasSearch && (
          <SearchIcon
            className="cursor-pointer flex h-10 w-10 items-center justify-center rounded-lg border border-lightGray"
            onClick={() => setShowSearch && setShowSearch(!showSearch)}
          />
        )}

        {customIcon ?? null}

        {btnName && (
          <Button
            value={screenWidth <= 700 ? "+" : btnName}
            className={cn("whitespace-nowrap", screenWidth <= 540 ? "px-3" : "px-5")}
            onClick={handleClick}
          />
        )}
        </div>
      </div>
    
  );
};
