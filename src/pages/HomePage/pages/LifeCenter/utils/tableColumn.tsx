import { ColumnDef } from "@tanstack/react-table";
import Elipsis from "@/assets/ellipse.svg";
import { SoulsWonType } from "@/utils";

export const tableColumns: ColumnDef<SoulsWonType>[] = [
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
    accessorKey: "contact_number",
  },
  {
    header: "LOCATION",
    accessorKey: "country",
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
