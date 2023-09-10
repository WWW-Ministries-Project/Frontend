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

function TableComponent({data,columns,filter,setFilter}) {
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
    onSortingChange: setSorting,
    onGlobalFilterChange: setFilter,
  });

  return (
    <>
      <table className="w-full">
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
                      { asc: "👆", desc: "👇" }[
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
                <td key={cell.id}>
                  {flexRender(cell.column.columnDef.cell, cell.getContext())}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
      <div className="flex justify-end gap-1 text-gray my-6 ">
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
      </div>
    </>
  );
}

TableComponent.propTypes = {
  // data: PropTypes.obj,
  // columns: PropTypes.obj,
  // filter: PropTypes.string,
  // setFilter: PropTypes.func
}
export default TableComponent;
