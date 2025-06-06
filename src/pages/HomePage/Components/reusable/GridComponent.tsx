import GridWrapper from "@/Wrappers/GridWrapper";
import {
  ColumnFilter,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table";
import React, { Dispatch, SetStateAction, useState } from "react";

interface GridComponentProps {
  data: any;
  columns: any;
  filter: any;
  setFilter: any;
  columnFilters?: ColumnFilter[];
  columnVisibility?: Record<string, boolean>;
  setColumnFilters?: Dispatch<SetStateAction<ColumnFilter[]>>;
  displayedCount: number;
  renderRow: (row: any) => React.ReactNode;
}

const GridComponent: React.FC<GridComponentProps> = ({
  data,
  columns,
  filter,
  setFilter,
  displayedCount,
  renderRow,
  ...props
}) => {
  const [sorting, setSorting] = useState([]);
  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    state: {
      sorting: sorting,
      globalFilter: filter,
      columnFilters: props.columnFilters,
      columnVisibility: props.columnVisibility
    },
    initialState: {
      pagination: {
        pageIndex: 0,
        pageSize: displayedCount || 12,
      },
    },
    //@ts-expect-error will have to check this out
    onSortingChange: setSorting,
    onGlobalFilterChange: setFilter,
    onColumnFiltersChange: props.setColumnFilters,
  });

  return (
    <div>
      <GridWrapper>
        {table.getRowModel().rows.map((row) => renderRow(row))}
      </GridWrapper>
      {data.length > displayedCount ? (
        <div className={`flex justify-end gap-1 text-gray my-2`}>
          <button
            onClick={() => table.setPageIndex(0)}
            className={
              table.getCanPreviousPage()
                ? "border border-primary p-1 sm rounded-md text-primary"
                : "border border-lightGray p-1 rounded-md opacity-50"
            }
          >
            <span className="hidden sm:inline">First page</span>
            <span className="inline sm:hidden text-xs">First</span>
          </button>
          <button
            className={
              table.getCanPreviousPage()
                ? "border border-primary p-1 rounded-md text-primary"
                : "border border-lightGray p-1 rounded-md opacity-50"
            }
            disabled={!table.getCanPreviousPage()}
            onClick={() => table.previousPage()}
          >
            <span className="hidden sm:inline">Previous page</span>
            <span className="inline sm:hidden text-xs">Previous</span>
          </button>
          <button
            className={
              table.getCanNextPage()
                ? "border border-primary p-1 rounded-md text-primary"
                : "border border-lightGray p-1 rounded-md opacity-50"
            }
            disabled={!table.getCanNextPage()}
            onClick={() => table.nextPage()}
          >
            <span className="hidden sm:inline">Next page</span>
            <span className="inline sm:hidden text-xs">Next</span>
          </button>
          <button
            className={
              table.getCanNextPage()
                ? "border border-primary p-1 rounded-md text-primary"
                : "border border-lightGray p-1 rounded-md opacity-50"
            }
            onClick={() => table.setPageIndex(table.getPageCount() - 1)}
          >
            <span className="hidden sm:inline">Last page</span>
            <span className="inline sm:hidden text-xs">Last</span>
          </button>
        </div>
      ) : null}
    </div>
  );
};

export default GridComponent;
