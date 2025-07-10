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
import PaginationComponent from "./PaginationComponent";

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
        <div className="sticky bottom-0 bg-white">
          <PaginationComponent
          canGoBack={table.getCanPreviousPage()}
          goBack={table.previousPage}
          canGoForward={table.getCanNextPage()}
          goForward={table.nextPage}
          goToPage={table.setPageIndex}
          goFirst={() => table.setPageIndex(0)}
          totalPages={table.getPageCount()}
        />
        </div>
      ) : null}
    </div>
  );
};

export default GridComponent;
