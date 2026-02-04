import { useFetch } from "@/CustomHooks/useFetch";
import { Orders } from "@/pages/HomePage/pages/MarketPlace/components/Orders/Orders";
import { getBaseOrderColumns } from "@/pages/HomePage/pages/MarketPlace/components/Orders/OrdersTableColumns";
import { api, decodeToken } from "@/utils";
import { useMemo } from "react";

export const MyOrders = () => {
  const user = decodeToken();
  const { data } = useFetch(api.fetch.fetchOrdersByUser, {
    user_id: `${user?.id}`,
  });

  const tableColumns = useMemo(() => {
    return getBaseOrderColumns([]);
  }, []);

  const filteredOrders = useMemo(()=>{
    return data?.data.filter((order) => order.market_status.toUpperCase() !== "ended");
  },[data]);

  return <Orders orders={filteredOrders || []} tableColumns={tableColumns} searchCustomer={false} />;
};
