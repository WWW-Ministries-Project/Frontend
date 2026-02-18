import TableComponent from "@/pages/HomePage/Components/reusable/TableComponent";
import { ColumnDef } from "@tanstack/react-table";

interface IProps{
  columns: ColumnDef<any, any>[];
  data: any[];
};

export const AnalyticsTable = ({ data, columns }: IProps) => {
  const fallbackColumns = [
    {
      header: "Life Center",
      accessorKey: "name",
    },
    {
      header: "Leader",
      accessorKey: "leader",
    },
    {
      header: "Souls Won",
      accessorKey: "count",
    },
    {
      header: "Performance",
    },
  ];
  return (
    <div className="p-4 border rounded-xl space-y-4">
      <div>
        <div className="font-bold text-xl">Life Centers Performance Table</div>
        <div className="text-sm">Detailed breakdown by center</div>
      </div>
      <div>
        {data.length === 0 ? (
          <div className="rounded-lg border border-dashed p-4 text-sm text-gray-600">
            No life center records found for the selected filters.
          </div>
        ) : (
          <TableComponent
            columns={columns?.length ? columns : fallbackColumns}
            data={data}
            displayedCount={12}
          />
        )}
      </div>
    </div>
  );
};
