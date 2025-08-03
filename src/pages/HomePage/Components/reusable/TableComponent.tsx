import {
  ColumnDef,
  ColumnFilter,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getSortedRowModel,
  SortingState,
  useReactTable,
} from "@tanstack/react-table";
import { Dispatch, SetStateAction, useState } from "react";
import { PaginationComponent } from "./PaginationComponent";

interface TableComponentProps<TData> {
  data: TData[];
  columns: ColumnDef<TData, any>[];
  filter?: string;
  columnFilters?: ColumnFilter[];
  columnVisibility?: Record<string, boolean>;
  setColumnFilters?: Dispatch<SetStateAction<ColumnFilter[]>>;
  setFilter?: Dispatch<SetStateAction<string>>;
  displayedCount?: number;
  rowClass?: string;
  headClass?: string;
  className?: string;
  onRowClick?: (data: any) => void;
  total?: number;
  take?: number;
  onPageChange?: (newPage: number, limit: number) => void;
}

function TableComponent<TData>({
  data,
  columns,
  filter = "",
  columnFilters,
  setColumnFilters,
  setFilter,
  columnVisibility,
  displayedCount = 12,
  rowClass = "",
  headClass = "",
  onRowClick = () => {},
  ...props
}: TableComponentProps<TData>) {
  const [sorting, setSorting] = useState<SortingState>([]);
  const table = useReactTable<TData>({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    state: {
      sorting,
      globalFilter: filter,
      columnFilters,
      columnVisibility,
    },
    onSortingChange: setSorting,
    onGlobalFilterChange: setFilter,
    onColumnFiltersChange: setColumnFilters,
  });

  const handleRowClick = (data: any) => {
    onRowClick(data.original);
  };

  return (
    <div className={`overflow-x-auto ${props.className}`}>
      <div className="rounded-lg shadow-md bg-white">
        <div className="hideScrollbar rounded-lg overflow-y-scroll">
          <table className="w-full text-sm text-left table-auto">
            <thead>
              {table.getHeaderGroups().map((headerGroup) => (
                <tr
                  key={headerGroup.id}
                  className="bg-lightGray text-primary  border-b border-lightGray"
                >
                  {headerGroup.headers.map((header) => (
                    <th
                      key={header.id}
                      onClick={header.column.getToggleSortingHandler()}
                      className={`py-4 px-6 text-left font-semibold cursor-pointer ${headClass}`}
                    >
                      {flexRender(
                        header.column.columnDef.header,
                        header.getContext()
                      )}
                      <span className="ml-2">
                        {header.column.getIsSorted() ? (
                          <span>
                            {header.column.getIsSorted() === "asc" ? "↑" : "↓"}
                          </span>
                        ) : null}
                      </span>
                    </th>
                  ))}
                </tr>
              ))}
            </thead>
            <tbody>
              {table.getRowModel().rows.map((row) => (
                <tr
                  key={row.id}
                  className={`border-b border-x border-lightGray text-primary h-16 leading-6 hover:bg-lightGray/20 cursor-pointer ${rowClass}`}
                  onClick={() => handleRowClick(row)}
                >
                  {row.getVisibleCells().map((cell) => (
                    <td key={cell.id} className="px-4 py-3">
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext()
                      )}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      {props.total ?? displayedCount > displayedCount ? (
        <PaginationComponent
          total={props.total}
          take={displayedCount}
          onPageChange={props.onPageChange || (() => {})}
        />
      ) : null}
    </div>
  );
}

export default TableComponent;
