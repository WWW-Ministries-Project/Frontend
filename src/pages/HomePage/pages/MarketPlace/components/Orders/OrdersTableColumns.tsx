import { IOrders } from "@/utils";
import { ColumnDef } from "@tanstack/react-table";

export const getBaseOrderColumns = (
  otherFields: ColumnDef<IOrders>[]
): ColumnDef<IOrders>[] => [
  ...otherFields,
  {
    header: "Product name",
    cell: ({ row }) => <div>{row.original.name}</div>,
  },
  {
    header: "Type",
    accessorKey: "product_type",
  },
  {
    header: "Category",
    accessorKey: "product_category",
  },
  {
    header: "Color",
    accessorKey: "color",
    cell: ({ row }) => (
      <div
        style={{ backgroundColor: row.original.color }}
        className="w-8 h-5 rounded-lg"
      ></div>
    ),
  },
  {
    header: "Size",
    accessorKey: "size",
  },
  {
    header: "Qty",
    accessorKey: "quantity",
  },
  {
    header: "Price (GHC)",
    accessorKey: "price_amount",
  },
  {
    header: "Total (GHC)",
    cell: ({ row }) => (
      <div>
        {(row.original.price_amount * row.original.quantity).toFixed(2)}
      </div>
    ),
  },
  {
    header: "Payment",
    accessorKey: "payment_status",
    cell: ({ row }) => getStatusBadge(row.original.payment_status),
  },
];

export const getStatusColor = (status: string) => {
  switch (status) {
    case "pending":
      return "bg-[#EAECF0]";
    case "success":
    case "delivered":
      return "bg-green-500 text-white";

    default:
      return "bg-red-500 text-white";
  }
};

export const getStatusBadge = (status: string) => {
  const color = getStatusColor(status);
  return (
    <span className={`inline-block px-2 py-1 rounded ${color}`}>
      {status?.charAt(0).toUpperCase() + status?.slice(1)}
    </span>
  );
};
