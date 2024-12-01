import {
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
  ColumnDef,
  SortingState,
  Table
} from "@tanstack/react-table";
import { Dispatch, SetStateAction, useState } from "react";

interface TableComponentProps<TData> {
  data: TData[]; 
  columns: ColumnDef<TData, any>[]; 
  filter?: string; 
  setFilter: Dispatch<SetStateAction<string>>; 
  displayedCount?: number;
  rowClass?: string;
  headClass?: string;
}

function TableComponent<TData>({
  data,
  columns,
  filter = "", 
  setFilter,
  displayedCount = 12,
  rowClass = "",
  headClass = "",
  ...props
}: TableComponentProps<TData>) {
  const [sorting, setSorting] = useState<SortingState>([]);
  const table = useReactTable<TData>({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    state: {
      sorting,
      globalFilter: filter,
    },
    initialState: {
      pagination: {
        pageIndex: 0,
        pageSize: displayedCount,
      },
    },
    onSortingChange: setSorting,
    onGlobalFilterChange: setFilter,
  });

  return (
    <div className="overflow-x-auto">
      <div className="rounded-xl">
        <div className="hideScrollbar rounded-xl overflow-y-scroll">
          <table className="w-full rounded-xl">
            <thead>
              {table.getHeaderGroups().map((headerGroup) => (
                <tr
                  key={headerGroup.id}
                  className={`text-center text-mainGray py-4 bg-[#f8f9f999] ${rowClass}`}
                >
                  {headerGroup.headers.map((header) => (
                    <th
                      key={header.id}
                      onClick={header.column.getToggleSortingHandler()}
                      className={`py-4 px-2 text-left cursor-pointer ${headClass}`}
                    >
                      {flexRender(header.column.columnDef.header, header.getContext())}
                      <span>
                        {{ asc: "  ↑", desc: "  ↓" }[header.column.getIsSorted() as string ?? ""]}
                      </span>
                    </th>
                  ))}
                </tr>
              ))}
            </thead>
            <tbody className="bg-white">
              {table.getRowModel().rows.map((row) => (
                <tr
                  key={row.id}
                  className={`border-b-2 border-[#EBEFF2] h-20 text-dark900 leading-6 hover:bg-[#f8f9f999] ${rowClass}`}
                >
                  {row.getVisibleCells().map((cell) => (
                    <td key={cell.id} className="px-1">
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      {data.length > displayedCount ? (
        <PaginationComponent
          canGoBack={table.getCanPreviousPage()}
          goBack={table.previousPage}
          canGoForward={table.getCanNextPage()}
          goForward={table.nextPage}
          goToPage={table.setPageIndex}
          goFirst={() => table.setPageIndex(0)}
          totalPages={table.getPageCount()}
        />
      ) : null}
    </div>
  );
}

export default TableComponent;
