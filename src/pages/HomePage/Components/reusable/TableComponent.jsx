import {
  useReactTable,
  flexRender,
  getCoreRowModel,
  getPaginationRowModel,
  getSortedRowModel,
} from "@tanstack/react-table";
import data from "/public/data/MOCK_DATA.json";
import { useState } from "react";

function TableComponent() {
  const columns = [
    {
      header: "Name",
      accessorKey: "name",
    },
    {
      header: "Phone number",
      accessorKey: "phone_number",
    },
    {
      header: "last visited",
      accessorKey: "last_visited",
      cell: (info) => info.getValue() + " days ago",
    },
    {
      header: "Visits",
      accessorKey: "vieits",
      cell: (info) => info.getValue() + " visits",
    },
    {
      header: "Created",
      accessorKey: "created",
    },
    {
      header: "Action",
      accessorKey: "action",
    },
  ];
  const [sorting, setSorting] = useState([]);
  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    state: {
      sorting: sorting,
    },
    onSortingChange: setSorting,
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
              className="border-b-2 border-[#EBEFF2] h-20 text-dark900 leading-6 ">
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

export default TableComponent;
