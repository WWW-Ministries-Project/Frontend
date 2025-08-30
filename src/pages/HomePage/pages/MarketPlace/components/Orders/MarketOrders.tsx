import { useFetch } from "@/CustomHooks/useFetch";
import { Orders } from "./Orders";
import { api } from "@/utils";
import { useParams } from "react-router-dom";
import { decodeQuery } from "@/pages/HomePage/utils";
import { getBaseOrderColumns } from "./OrdersTableColumns";
import { useMemo } from "react";

export function MarketOrders() {
  const { id } = useParams();
  const market_id = decodeQuery(String(id));
  const { data } = useFetch(api.fetch.fetchOrdersByMarket, { market_id });
  const tableColumns = useMemo(() => {
    return getBaseOrderColumns([
      {
        header: "Name",
        cell: ({ row }) => {
          const full_name = `${row.original.first_name} ${row.original.last_name}`;
          return (
            <div>
              <p>
                {`${full_name}`}
              </p>
               <p className="text-xs">{row.original.email}</p>
            </div>
          );
        },
      },
      {
        header: "Location",
        accessorKey: "country",
      },
      {
        header: "Phone",
        accessorKey: "phone_number",
      },
    ]);
  }, []);

  return (
    <div className="mb-10">
      <Orders
        orders={data?.data || []}
        tableColumns={tableColumns}
        showExport
      />
    </div>
  );
}
