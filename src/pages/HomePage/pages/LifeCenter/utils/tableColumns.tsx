import { SoulsWon } from "@/utils/api/lifeCenter/interface";
import { ColumnDef } from "@tanstack/react-table";
import Elipsis from "@/assets/ellipse.svg";

export const tableColumns: ColumnDef<SoulsWon>[] = [
  {
    header: "NAME",
    accessorKey: "name",
    cell: ({ row }) => {
      const name = `${row.original.first_name} ${row.original.last_name}`;
      return <div>{name}</div>;
    },
  },
  {
    header: "CONTACT",
    accessorKey: "contact",
  },
  {
    header: "LOCATION",
    accessorKey: "location",
  },
  {
    header: "DATE WON",
    accessorKey: "date_won",
  },
  {
    header: "WON BY",
    accessorKey: "won_by",
  },
  {
    header: "Action",
    cell: ({ row }) => {
      return (
        <div>
          <img src={Elipsis} alt="elipsis" />
        </div>
      );
    },
  },
];
