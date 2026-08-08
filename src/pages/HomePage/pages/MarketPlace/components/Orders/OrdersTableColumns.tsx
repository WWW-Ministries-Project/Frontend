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
    cell: ({ row }) => {
      const color = row.original.color;
      const hasColor = typeof color === "string" && color.trim().length > 0;

      if (!hasColor) return <div>-</div>;

      return (
        <div className="flex items-center gap-2">
          <div
            style={{ backgroundColor: color }}
            className="w-8 h-5 rounded-lg border"
          ></div>
          <span className="text-xs text-gray-600">Selected</span>
        </div>
      );
    },
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
  {
    header: "Delivery",
    accessorKey: "delivery_status",
    cell: ({ row }) => getDeliveryStatusBadge(row.original.delivery_status),
  },
];

export const getStatusColor = (status: string) => {
  switch (status) {
    case "pending":
      return "bg-lightGray/40";
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
    <span className={`inline-block px-2.5 py-1 rounded-full text-xs font-medium ${color}`}>
      {status?.charAt(0).toUpperCase() + status?.slice(1)}
    </span>
  );
};

export const getDeliveryStatusColor = (status?: string) => {
  switch (status) {
    case "shipped":
      return "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300";
    case "delivered":
      return "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300";
    case "cancelled":
      return "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300";
    case "pending":
    default:
      return "bg-lightGray/40 text-gray-700";
  }
};

export const getDeliveryStatusBadge = (status?: string) => {
  const label = status || "pending";
  const color = getDeliveryStatusColor(status);
  return (
    <span
      className={`inline-block px-2.5 py-1 rounded-full text-xs font-medium capitalize ${color}`}
    >
      {label}
    </span>
  );
};
