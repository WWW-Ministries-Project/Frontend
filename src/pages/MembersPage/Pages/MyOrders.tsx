import EmptyState from "@/components/EmptyState";
import TableComponent from "@/pages/HomePage/Components/reusable/TableComponent";
import { ICartItem } from "@/utils";
import { ColumnDef } from "@tanstack/react-table";
import { useMemo } from "react";

export const MyOrders = () => {
  const tableColumns: ColumnDef<MyOrders>[] = useMemo(
    () => [
      {
        header: "Product name",
        cell: ({ row }) => <div>{`${row.original.name} `}</div>,
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
        cell: ({ row }) => {
          return (
            <div>
              {(row.original.price_amount * row.original.quantity).toFixed(2)}
            </div>
          );
        },
      },

      {
        header: "Payment",
        accessorKey: "payment_status",
        cell: ({ row }) => {
          return getStatusBadge(row.original.payment_status);
        },
      },
      {
        header: "Delivery",
        accessorKey: "delivery_status",
        cell: ({ row }) => {
          return getStatusBadge(row.original.delivery_status);
        },
      },
    ],
    []
  );
  return (
    <>
      <TableComponent
        columns={tableColumns}
        data={[]}
        displayedCount={10}
        className="relative"
      />
      <EmptyState msg="No Orders made yet" />
    </>
  );
};

interface MyOrders extends ICartItem {
  payment_status: "pending" | "success" | "failed";
  delivery_status: "pending" | "delivered" | "cancelled";
}


const getStatusColor = (status: string) => {
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
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </span>
  );
};
