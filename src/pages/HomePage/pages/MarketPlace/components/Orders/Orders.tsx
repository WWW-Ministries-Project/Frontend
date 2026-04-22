import { ColumnDef } from "@tanstack/react-table";
import { Workbook } from "exceljs";
import { ReactNode, useCallback, useEffect, useMemo, useState } from "react";

import EmptyState from "@/components/EmptyState";
import { HeaderControls } from "@/components/HeaderControls";
import TableComponent from "@/pages/HomePage/Components/reusable/TableComponent";
import type { IOrders, PaymentStatus } from "@/utils";
import { OrderFilters } from "./OrderFilters";

const getStatusBadge = (status: PaymentStatus) => {
  const base =
    "px-2 py-1 rounded-full text-xs font-medium capitalize inline-flex items-center";

  switch (status) {
    case "success":
    case "delivered":
      return (
        <span className={`${base} bg-green-100 text-green-700`}>
          {status}
        </span>
      );
    case "pending":
      return (
        <span className={`${base} bg-yellow-100 text-yellow-700`}>
          {status}
        </span>
      );
    default:
      return (
        <span className={`${base} bg-red-100 text-red-700`}>
          {status}
        </span>
      );
  }
};

const isMobileScreen = () => typeof globalThis !== "undefined" && window.innerWidth <= 1024;
const orderSummaryFormatter = new Intl.NumberFormat("en-US");

const getOrderQuantity = (order: IOrders) => {
  const quantity = Number(order.quantity);
  return Number.isFinite(quantity) ? quantity : 0;
};

const getOrderDateValue = (order: IOrders) => {
  const timestamp = order.created_at || order.order_created_at || order.ordered_at;
  if (!timestamp) return "";

  const date = new Date(timestamp);
  if (Number.isNaN(date.getTime())) return "";

  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, "0");
  const day = `${date.getDate()}`.padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const OrderCard = ({
  order,
  renderOrderAction,
}: {
  order: IOrders;
  renderOrderAction?: (order: IOrders) => ReactNode;
}) => {
  const total = (order.price_amount * order.quantity).toFixed(2);

  return (
    <div className="border rounded-lg p-4 bg-white shadow-sm space-y-3">
      {/* Header */}
      <div className="flex items-start gap-3">
        <img
          src={order.image_url}
          alt={order.name}
          className="w-14 h-14 rounded-md object-cover flex-shrink-0"
        />
        <div className="flex-1">
          <p className="font-semibold text-gray-900">{order.name}</p>
          <p className="text-xs text-gray-500">{order.order_number}</p>
        </div>
      </div>

      {/* Price + Status */}
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium">
          GHC {total} • Qty {order.quantity}
        </p>
        {getStatusBadge(order.payment_status)}
      </div>

      {/* Attributes */}
      <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
        <div>
          <span className="text-gray-500">Type</span>
          <p>{order.product_type}</p>
        </div>
        <div>
          <span className="text-gray-500">Category</span>
          <p>{order.product_category}</p>
        </div>
        <div>
          <span className="text-gray-500">Size</span>
          <p>{order.size}</p>
        </div>
        <div>
          <span className="text-gray-500">Color</span>
          <div
            className="w-6 h-4 rounded"
            style={{ backgroundColor: order.color }}
          />
        </div>
      </div>

      {/* Customer */}
      <div className="pt-2 border-t text-sm">
        <p className="font-medium">
          {order.first_name} {order.last_name}
        </p>
        <p className="text-gray-500">{order.country}</p>
      </div>

      {renderOrderAction && (
        <div className="pt-2 border-t">{renderOrderAction(order)}</div>
      )}
    </div>
  );
};


interface IProps{
  orders: IOrders[] | undefined;
  tableColumns: ColumnDef<IOrders>[];
  searchCustomer?: boolean
  showExport?: boolean
  defaultMarketStatus?: "active" | "upcoming" | "ended" | "";
  renderOrderAction?: (order: IOrders) => ReactNode;
  headerAction?: ReactNode;
  enableOrderDateFilter?: boolean;
}
export const Orders = ({
  orders,
  tableColumns,
  searchCustomer = true,
  showExport,
  defaultMarketStatus = "",
  renderOrderAction,
  headerAction,
  enableOrderDateFilter = false,
}: IProps) => {
  const [showSearch, setShowSearch] = useState(false);
  const [showFilter, setShowFilter] = useState(false);
  const [filterOrders, setFilterOrders] = useState<IFilters>({
    customer_name: "",
    product_type: "",
    product_category: "",
    color: "",
    size: "",
    payment_status: "",
    market_status: defaultMarketStatus,
    order_date: "",
  });

  const [isMobile, setIsMobile] = useState(isMobileScreen());

  useEffect(() => {
    const onResize = () => setIsMobile(isMobileScreen());
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  useEffect(() => {
    setFilterOrders((prev) => ({ ...prev, market_status: defaultMarketStatus }));
  }, [defaultMarketStatus]);

  const allOrders = useMemo(() => {
    const normalizedOrders = orders || [];

    return normalizedOrders.filter((order) => {
      return Object.entries(filterOrders).every(([key, value]) => {
        if (!value) return true;

        if (key === "customer_name") {
          const fullName = `${order.first_name} ${order.last_name}`.toLowerCase();
          return fullName.trim().includes(value.trim().toLowerCase());
        }

        if (key === "order_date") {
          return getOrderDateValue(order) === value;
        }

        const normalizedFilterValue = value.trim().toLowerCase();
        const normalizedOrderValue = String(order[key as keyof IOrders] || "")
          .trim()
          .toLowerCase();

        return normalizedOrderValue === normalizedFilterValue;
      });
    });
  }, [filterOrders, orders]);

  const totalOrderQuantity = useMemo(
    () => allOrders.reduce((total, order) => total + getOrderQuantity(order), 0),
    [allOrders]
  );
  

  const handleExport = useCallback(() => {
    if (allOrders.length === 0) return;
    exportToExcel(allOrders);
  }, [allOrders]);

  const handleFilters = (key: string, value: string) => {
    setFilterOrders((prev) => ({
      ...prev,
      [key]: value ?? "",
    }));
  };

  const allColors = Array.from(
    new Set(
      (orders || [])
        .map((order) => order.color)
        .filter((color): color is string => Boolean(color))
    )
  );
  const allSizes = Array.from(
    new Set(
      (orders || [])
        .map((order) => order.size)
        .filter((size): size is string => Boolean(size))
    )
  ).map((size) => {
    return {
      label: size,
      value: size,
    };
  });

  return (
    <>
      <HeaderControls
        title={`Orders (${orderSummaryFormatter.format(allOrders.length)})`}
        subtitle={`Total quantity: ${orderSummaryFormatter.format(totalOrderQuantity)}`}
        btnName={showExport && allOrders?.length > 0 ? "Export to Excel" : ""}
        screenWidth={typeof window !== "undefined" ? window.innerWidth : 1024}
        handleClick={handleExport}
        hasFilter={true}
        hasSearch={searchCustomer}
        showSearch={showSearch}
        setShowSearch={setShowSearch}
        showFilter={showFilter}
        setShowFilter={setShowFilter}
        customIcon={headerAction}
      />

      {
        <OrderFilters
          onChange={handleFilters}
          searchValue={filterOrders.customer_name}
          showSearch={showSearch}
          showFilter={showFilter}
          colors={allColors || []}
          sizes={allSizes}
          selectedColor={filterOrders.color}
          selectedMarketStatus={filterOrders.market_status}
          selectedOrderDate={filterOrders.order_date}
          showOrderDateFilter={enableOrderDateFilter}
        />
      }
      {isMobile ? (
        <div className=" grid sm:grid-cols-2 gap-4">
          {allOrders.map((order) => (
            <OrderCard
              key={String(order.id)}
              order={order}
              renderOrderAction={renderOrderAction}
            />
          ))}
        </div>
      ) : (
        <TableComponent
          columns={tableColumns}
          data={allOrders || []}
          displayedCount={10}
          className="relative"
        />
      )}
      {allOrders?.length === 0 && (
        <EmptyState scope="section" msg="No Orders found" />
      )}
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

export interface IFilters {
  customer_name: string;
  product_type: string;
  product_category: string;
  color: string;
  size: string;
  payment_status: PaymentStatus | "";
  market_status: "active" | "upcoming" | "ended" | "";
  order_date: string;
}
