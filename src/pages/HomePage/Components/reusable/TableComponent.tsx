import {
  ColumnDef,
  ColumnFilter,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getSortedRowModel,
  SortingState,
  useReactTable,
  RowSelectionState,
} from "@tanstack/react-table";
import { Dispatch, SetStateAction, useState, useMemo } from "react";
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
  // New props for bulk actions
  enableSelection?: boolean;
  onBulkAction?: (selectedRows: TData[], action: string) => void;
  bulkActions?: { label: string; value: string; variant?: 'default' | 'danger' }[];
  showNumberColumn?: boolean;
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
  enableSelection = false,
  onBulkAction,
  bulkActions = [],
  showNumberColumn = true,
  ...props
}: TableComponentProps<TData>) {
  const [sorting, setSorting] = useState<SortingState>([]);
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({});

  // Create enhanced columns with number and checkbox columns
  const enhancedColumns = useMemo(() => {
    const newColumns: ColumnDef<TData, any>[] = [];

    // Add checkbox column if selection is enabled
    if (enableSelection) {
      newColumns.push({
        id: "select",
        header: ({ table }) => (
          <input
            type="checkbox"
            checked={table.getIsAllRowsSelected()}
            onChange={table.getToggleAllRowsSelectedHandler()}
            className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 focus:ring-2"
          />
        ),
        cell: ({ row }) => (
          <input
            type="checkbox"
            checked={row.getIsSelected()}
            onChange={row.getToggleSelectedHandler()}
            className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 focus:ring-2"
          />
        ),
        enableSorting: false,
        size: 50,
      });
    }

    // Add number column if enabled
    if (showNumberColumn) {
      newColumns.push({
        id: "rowNumber",
        header: "#",
        cell: ({ row }) => {
          const currentPage = Math.floor(row.index / displayedCount);
          const rowNumberOnPage = (row.index % displayedCount) + 1;
          const globalRowNumber = currentPage * displayedCount + rowNumberOnPage;
          return <span className="font-medium text-gray-600">{globalRowNumber}</span>;
        },
        enableSorting: false,
        size: 60,
      });
    }

    // Add original columns
    newColumns.push(...columns);

    return newColumns;
  }, [columns, enableSelection, showNumberColumn, displayedCount]);

  const table = useReactTable<TData>({
    data,
    columns: enhancedColumns,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    state: {
      sorting,
      globalFilter: filter,
      columnFilters,
      columnVisibility,
      rowSelection,
    },
    onSortingChange: setSorting,
    onGlobalFilterChange: setFilter,
    onColumnFiltersChange: setColumnFilters,
    onRowSelectionChange: setRowSelection,
    enableRowSelection: enableSelection,
  });

  const handleRowClick = (data: any, event: React.MouseEvent) => {
    // Don't trigger row click if clicking on checkbox
    if ((event.target as HTMLInputElement).type === 'checkbox') {
      return;
    }
    onRowClick(data.original);
  };

  const selectedRows = table.getFilteredSelectedRowModel().rows;
  const selectedCount = selectedRows.length;

  const handleBulkAction = (action: string) => {
    if (onBulkAction && selectedRows.length > 0) {
      const selectedData = selectedRows.map(row => row.original);
      onBulkAction(selectedData, action);
      // Clear selection after action
      setRowSelection({});
    }
  };

  return (
    <div className={`overflow-x-auto ${props.className}`}>
      {/* Bulk Actions Bar */}
      {enableSelection && selectedCount > 0 && bulkActions.length > 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <span className="text-sm font-medium text-blue-700">
              {selectedCount} item{selectedCount !== 1 ? 's' : ''} selected
            </span>
          </div>
          <div className="flex items-center space-x-2">
            {bulkActions.map((action) => (
              <button
                key={action.value}
                onClick={() => handleBulkAction(action.value)}
                className={`px-3 py-1 text-sm font-medium rounded-md transition-colors ${
                  action.variant === 'danger'
                    ? 'bg-red-600 text-white hover:bg-red-700'
                    : 'bg-blue-600 text-white hover:bg-blue-700'
                }`}
              >
                {action.label}
              </button>
            ))}
            <button
              onClick={() => setRowSelection({})}
              className="px-3 py-1 text-sm font-medium text-gray-600 hover:text-gray-800 transition-colors"
            >
              Clear Selection
            </button>
          </div>
        </div>
      )}

      <div className="rounded-lg shadow-md bg-white">
        <div className="hideScrollbar rounded-lg overflow-y-scroll">
          <table className="w-full text-sm text-left table-auto">
            <thead>
              {table.getHeaderGroups().map((headerGroup) => (
                <tr
                  key={headerGroup.id}
                  className="bg-lightGray text-primary border-b border-lightGray"
                >
                  {headerGroup.headers.map((header) => (
                    <th
                      key={header.id}
                      onClick={header.column.getCanSort() ? header.column.getToggleSortingHandler() : undefined}
                      className={`py-4 px-6 text-left font-semibold ${
                        header.column.getCanSort() ? 'cursor-pointer' : ''
                      } ${headClass}`}
                      style={{
                        width: header.getSize() !== 150 ? header.getSize() : undefined,
                      }}
                    >
                      {flexRender(
                        header.column.columnDef.header,
                        header.getContext()
                      )}
                      {header.column.getCanSort() && (
                        <span className="ml-2">
                          {header.column.getIsSorted() ? (
                            <span>
                              {header.column.getIsSorted() === "asc" ? "↑" : "↓"}
                            </span>
                          ) : null}
                        </span>
                      )}
                    </th>
                  ))}
                </tr>
              ))}
            </thead>
            <tbody>
              {table.getRowModel().rows.map((row) => (
                <tr
                  key={row.id}
                  className={`border-b border-x border-lightGray text-primary h-16 leading-6 hover:bg-lightGray/20 cursor-pointer ${
                    row.getIsSelected() ? 'bg-blue-50' : ''
                  } ${rowClass}`}
                  onClick={(e) => handleRowClick(row, e)}
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
      {props.total && props.total > displayedCount ? (
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