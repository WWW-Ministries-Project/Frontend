import {
  useReactTable,
  flexRender,
  getCoreRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  getFilteredRowModel
} from "@tanstack/react-table";
import { useState } from "react";
import PropTypes from 'prop-types';
import MemberCard from "../../pages/Members/Components/MemberCard";
import { useLocation } from "react-router-dom";
import GridWrapper from "/src/Wrappers/GridWrapper";

function TableComponent({ data, columns, filter, setFilter, tableView, displayedCount, ...props }) {
  const [sorting, setSorting] = useState([]);
  const location = useLocation();
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
        {(!tableView && location.pathname?.toLowerCase() === "/home/members") ? 
          <GridWrapper>
            {table.getRowModel().rows.map((row) => (
              <MemberCard 
                key={row.id}
                id={row.original.id}
                name={row.original.name}
                userInfo={row.original}
                email={row.original.email}
                primary_number={`${row.original.country_code?row.original.country_code:""} ${row.original.primary_number}`}
                photo={row.original.photo}
                department={row.original.department[0] ? row.original.department[0].department_info.name : ""} 
              />
            ))}
          </GridWrapper> :
          <div className="hideScrollbar rounded-xl h-[75vh] overflow-y-scroll">
            <table className="w-full rounded-xl ">
              <thead>
                {table.getHeaderGroups().map((headerGroup) => (
                  <tr
                    key={headerGroup.id}
                    className={"text-center text-[#080808] font-bold py-4 bg-[#f8f9f999] " + props.rowClass}>
                    {headerGroup.headers.map((header) => (
                      <th
                        key={header.id}
                        onClick={header.column.getToggleSortingHandler()}
                        className="py-4 px-2 text-left text-mainGray text-[#080808] font-semi-bold cursor-pointer">
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
        <div className={`flex justify-end gap-1 text-gray ${(!tableView && location.pathname?.toLowerCase() === "/home/members") ? 'my-2' : 'my-2'}`}>
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
  tableView: PropTypes.bool,
  displayedCount: PropTypes.number,
  rowClass: PropTypes.string
}
export default TableComponent;
