import { ColumnDef } from "@tanstack/react-table";
import { Workbook } from "exceljs";
import { useCallback } from "react";

import EmptyState from "@/components/EmptyState";
import { HeaderControls } from "@/components/HeaderControls";
import TableComponent from "@/pages/HomePage/Components/reusable/TableComponent";
import type { IOrders } from "@/utils";
interface IProps {
  orders: IOrders[] | null;
  tableColumns: ColumnDef<IOrders>[];
  showExport?: boolean;
}
export const Orders = ({ orders, tableColumns, showExport }: IProps) => {
  const handleExport = useCallback(() => {
    exportToExcel(orders!);
  }, [orders]);
  return (
    <>
      <HeaderControls
        title="Orders"
        btnName={showExport && orders && orders?.length > 0 ? "Export to Excel" : ""}
        screenWidth={window.innerWidth}
        handleClick={handleExport}
      />
      <TableComponent
        columns={tableColumns}
        data={orders || []}
        displayedCount={10}
        className="relative"
      />
      {orders?.length === 0 && <EmptyState msg="No Orders made yet" />}
    </>
  );
};

function getPaymentStyle(status: string) {
  switch (status) {
    case "pending":
      return {
        fill: {
          type: "pattern" as const,
          pattern: "solid" as const,
          fgColor: { argb: "FFEAECF0" },
        },
        font: {
          color: { argb: "FF000000" },
        },
      };
    case "success":
    case "delivered":
      return {
        fill: {
          type: "pattern" as const,
          pattern: "solid" as const,
          fgColor: { argb: "FF22C55E" },
        },
        font: {
          color: { argb: "FFFFFFFF" },
        },
      };
    default:
      return {
        fill: {
          type: "pattern" as const,
          pattern: "solid" as const,
          fgColor: { argb: "FFEF4444" },
        },
        font: {
          color: { argb: "FFFFFFFF" },
        },
      };
  }
}

async function exportToExcel(orders: IOrders[]) {
  const workbook = new Workbook();
  const worksheet = workbook.addWorksheet("Orders");

  worksheet.columns = [
    { header: "Customer", key: "customer" },
    { header: "Email", key: "email" },
    { header: "Phone", key: "phone_number" },
    { header: "Country", key: "country" },
    { header: "Product Name", key: "name" },
    { header: "Type", key: "product_type" },
    { header: "Category", key: "product_category" },
    { header: "Color", key: "color" },
    { header: "Size", key: "size" },
    { header: "Quantity", key: "quantity" },
    { header: "Price (GHC)", key: "price_amount" },
    { header: "Total (GHC)", key: "total" },
    { header: "Payment Status", key: "payment_status" },
  ];

  orders.forEach((order) => {
    const row = worksheet.addRow({
      name: order.name,
      product_type: order.product_type,
      product_category: order.product_category,
      color: "",
      size: order.size,
      quantity: order.quantity,
      price_amount: order.price_amount,
      total: (order.price_amount * order.quantity).toFixed(2),
      payment_status: order.payment_status,
      customer: `${order.first_name} ${order.last_name}`,
      email: order.email,
      phone_number: order.phone_number,
      country: order.country,
    });

    const colorCell = row.getCell("color");
    if (typeof order.color === "string" && order.color.startsWith("#")) {
      const hex = order.color.replace("#", "");
      colorCell.fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: `FF${hex.toUpperCase()}` },
      };
    }

    const paymentCell = row.getCell("payment_status");
    const style = getPaymentStyle(order.payment_status);
    paymentCell.fill = style.fill;
    paymentCell.font = style.font;
  });

  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });

  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "Orders.xlsx";
  a.click();
  URL.revokeObjectURL(url);
}
