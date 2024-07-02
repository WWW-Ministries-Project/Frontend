import {
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable
} from "@tanstack/react-table";
import PropTypes from 'prop-types';
import { useState } from "react";

function TableComponent({ data, columns, filter, setFilter, displayedCount, ...props }) {
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
    },
    initialState: {
      pagination: {
        pageIndex: 0,
        pageSize: displayedCount || 12,
      },
    },
    onSortingChange: setSorting,
    onGlobalFilterChange: setFilter,
  });

  return (
    <div className="overflow-x-auto">
      <div className="rounded-xl">
        {
          <div className="hideScrollbar rounded-xl h-[75vh] overflow-y-scroll">
            <table className="w-full rounded-xl ">
              <thead>
                {table.getHeaderGroups().map((headerGroup) => (
                  <tr
                    key={headerGroup.id}
                    className={"text-center text-mainGray py-4 bg-[#f8f9f999] " + props.rowClass}>
                    {headerGroup.headers.map((header) => (
                      <th
                        key={header.id}
                        onClick={header.column.getToggleSortingHandler()}
                        className={"py-4 px-2 text-left cursor-pointer " + props.headClass}>
                        {flexRender(
                          header.column.columnDef.header,
                          header.getContext()
                        )}
                        <span>
                          {
                            { asc: "  ↑", desc: "  ↓" }[
                            header.column.getIsSorted() ?? null
                            ]
                          }
                        </span>
                      </th>
                    ))}
                  </tr>
                ))}
              </thead>
              <tbody className="bg-white ">
                {table.getRowModel().rows.map((row) => (
                  <tr
                    key={row.id}
                    className={"border-b-2 border-[#EBEFF2] h-20 text-dark900 leading-6 hover:bg-[#f8f9f999] " + props.rowClass} >
                    {row.getVisibleCells().map((cell) => (
                      <td key={cell.id} className="px-1">
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>}
      </div>
      {data.length > displayedCount ?
        <div className={`flex justify-end gap-1 text-gray my-2`}>
          <button
            onClick={() => table.setPageIndex(0)}
            className={
              table.getCanPreviousPage()
                ? "border border-primaryViolet p-1 sm rounded-md text-primaryViolet"
                : "border border-lightGray p-1 rounded-md opacity-50"
            }>
            <span className="hidden sm:inline">First page</span><span className="inline sm:hidden text-xs">First</span>
          </button>
          <button
            className={
              table.getCanPreviousPage()
                ? "border border-primaryViolet p-1 rounded-md text-primaryViolet"
                : "border border-lightGray p-1 rounded-md opacity-50"
            }
            disabled={!table.getCanPreviousPage()}
            onClick={() => table.previousPage()}>
            <span className="hidden sm:inline">Previous page</span><span className="inline sm:hidden text-xs">Previous</span>
          </button>
          <button
            className={
              table.getCanNextPage()
                ? "border border-primaryViolet p-1 rounded-md text-primaryViolet"
                : "border border-lightGray p-1 rounded-md opacity-50"
            }
            disabled={!table.getCanNextPage()}
            onClick={() => table.nextPage()}>
            <span className="hidden sm:inline">Next page</span><span className="inline sm:hidden text-xs">Next</span>
          </button>
          <button
            className={
              table.getCanNextPage()
                ? "border border-primaryViolet p-1 rounded-md text-primaryViolet"
                : "border border-lightGray p-1 rounded-md opacity-50"
            }
            onClick={() => table.setPageIndex(table.getPageCount() - 1)}>
            <span className="hidden sm:inline">Last page</span><span className="inline sm:hidden text-xs">Last</span>
          </button>
        </div>
        : null}
    </div>
  );
}

TableComponent.propTypes = {
  data: PropTypes.array,
  columns: PropTypes.array,
  filter: PropTypes.string,
  setFilter: PropTypes.func,
  displayedCount: PropTypes.number,
  rowClass: PropTypes.string,
  headClass: PropTypes.string
}
export default TableComponent;
