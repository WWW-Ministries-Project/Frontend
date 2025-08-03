import GridWrapper from "@/Wrappers/GridWrapper";
import {
  ColumnFilter,
  getCoreRowModel,
  getFilteredRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table";
import React, { Dispatch, SetStateAction, useState } from "react";
import { PaginationComponent } from "./PaginationComponent";

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
  total?: number;
  take?: number;
  onPageChange?: (newPage: number, limit: number) => void;
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
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    state: {
      sorting: sorting,
      globalFilter: filter,
      columnFilters: props.columnFilters,
      columnVisibility: props.columnVisibility,
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
      {props.total ?? displayedCount > displayedCount ? (
        <PaginationComponent
          total={props.total}
          take={displayedCount}
          onPageChange={props.onPageChange || (() => {})}
        />
      ) : null}
    </div>
  );
};

export default GridComponent;
