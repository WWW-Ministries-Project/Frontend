import TableComponent from "@/pages/HomePage/Components/reusable/TableComponent";
import { ColumnDef } from "@tanstack/react-table";
import EmptyState from "@/components/EmptyState";

interface IProps{
  columns: ColumnDef<Record<string, unknown>, unknown>[];
  data: Record<string, unknown>[];
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
          <EmptyState
            scope="section"
            msg="No life center records found"
            description="No records match the selected analytics filters."
          />
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
