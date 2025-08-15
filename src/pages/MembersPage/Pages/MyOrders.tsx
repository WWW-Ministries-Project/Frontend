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
      },
      {
        header: "Delivery",
        accessorKey: "delivery_status",
      },
    ],
    []
  );
  return (
    <div className="">
      <TableComponent
        columns={tableColumns}
        data={dummyOrders}
        displayedCount={10}
        className="relative"
      />
    </div>
  );
};

interface MyOrders extends ICartItem {
  payment_status: "pending" | "success" | "failed";
  delivery_status: "pending" | "delivered" | "cancelled";
}

const dummyOrders: MyOrders[] = [
  {
    name: "T-shirt",
    payment_status: "pending",
    delivery_status: "pending",
    id: "1",
    price_amount: 100,
    price_currency: "",
    quantity: 10,
    product_type: "Shirt",
    product_category: "Adults",
    image_url: "",
    color: "Red",
    size: "XL",
  },
];
