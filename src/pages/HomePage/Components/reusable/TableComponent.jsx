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

function TableComponent({ data, columns, filter, setFilter, tableView }) {
  const [sorting, setSorting] = useState([]);
  const [displayedCount] = useState(tableView ? 10 : 12);
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
        pageIndex: 0, //custom initial page index
        pageSize: displayedCount, //custom default page size
      },
    },
    onSortingChange: setSorting,
    onGlobalFilterChange: setFilter,
  });

  return (
    <>
      {(!tableView && location.pathname?.toLowerCase() === "/home/members") ? 
        <div className="w-full grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 justify-center">
          {table.getRowModel().rows.map((row) => (<MemberCard key={row.id} name={row.original.name} email={row.original.email} userInfo={row.original.user_info} department={row.original.department[0] ? row.original.department[0].department_info.name : ""} />))}
        </div> : <table className="w-full">
        <thead>
          {table.getHeaderGroups().map((headerGroup) => (
            <tr
              key={headerGroup.id}
              className="text-center text-[#080808] font-normal py-4 bg-[#f8f9f999]">
              {headerGroup.headers.map((header) => (
                <th
                  key={header.id}
                  onClick={header.column.getToggleSortingHandler()}
                  className="py-4 px-2 text-left text-[#080808] font-normal cursor-pointer">
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
        <tbody className="bg-white">
          {table.getRowModel().rows.map((row) => (
            <tr
              key={row.id}
              className="border-b-2 border-[#EBEFF2] h-20 text-dark900 leading-6 hover:bg-[#f8f9f999]">
              {row.getVisibleCells().map((cell) => (
                <td key={cell.id} className="px-1">
                  {flexRender(cell.column.columnDef.cell, cell.getContext())}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table> }
      {data.length > displayedCount ? <div className="flex justify-end gap-1 text-gray my-6 ">
        <button
          onClick={() => table.setPageIndex(0)}
          className={
            table.getCanPreviousPage()
              ? "border border-lightGray p-1 rounded-md "
              : "border border-lightGray p-1 rounded-md opacity-50"
          }>
          First page
        </button>
        <button
          className={
            table.getCanPreviousPage()
              ? "border border-lightGray p-1 rounded-md "
              : "border border-lightGray p-1 rounded-md opacity-50"
          }
          disabled={!table.getCanPreviousPage()}
          onClick={() => table.previousPage()}>
          Previous page
        </button>
        <button
          className={
            table.getCanNextPage()
              ? "border border-lightGray p-1 rounded-md "
              : "border border-lightGray p-1 rounded-md opacity-50"
          }
          disabled={!table.getCanNextPage()}
          onClick={() => table.nextPage()}>
          Next page
        </button>
        <button
          className={
            table.getCanNextPage()
              ? "border border-lightGray p-1 rounded-md "
              : "border border-lightGray p-1 rounded-md opacity-50"
          }
          onClick={() => table.setPageIndex(table.getPageCount() - 1)}>
          Last page
        </button>
      </div> : null}
    </>
  );
}

TableComponent.propTypes = {
  data: PropTypes.array,
  columns: PropTypes.array,
  filter: PropTypes.string,
  setFilter: PropTypes.func,
  tableView: PropTypes.bool
}
export default TableComponent;
