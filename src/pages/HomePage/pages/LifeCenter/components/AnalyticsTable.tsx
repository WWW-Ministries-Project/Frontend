import TableComponent from "@/pages/HomePage/Components/reusable/TableComponent";

interface IProps{
  columns: any[];
  data: any[];
};

export const AnalyticsTable = ({ data }: IProps) => {
  const columns = [
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
    //   cell: ({ row }: { row: import("@tanstack/react-table").Row<Center> }) => (
    //     <Badge
    //       className={
    //         row.original.count >
    //         processedData.totalSouls / processedData.totalCenters
    //           ? "bg-primary text-white "
    //           : row.original.count ===
    //             processedData.totalSouls / processedData.totalCenters
    //           ? "bg-gray-100"
    //           : "bg-white"
    //       }
    //     >
    //       {row.original.count >
    //       processedData.totalSouls / processedData.totalCenters
    //         ? "Excellent"
    //         : row.original.count ===
    //           processedData.totalSouls / processedData.totalCenters
    //         ? "Good"
    //         : "Average"}
    //     </Badge>
    //   ),
    },
  ];
  return (
    <div className="p-4 border rounded-xl space-y-4">
      <div>
        <div className="font-bold text-xl">Life Centers Performance Table</div>
        <div className="text-sm">Detailed breakdown by center</div>
      </div>
      <div>
        <TableComponent columns={columns} data={data} displayedCount={12} />
      </div>
    </div>
  );
};
