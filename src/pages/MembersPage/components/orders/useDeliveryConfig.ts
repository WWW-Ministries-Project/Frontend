import { useFetch } from "@/CustomHooks/useFetch";
import { PICKUP_LOCATION } from "@/pages/HomePage/pages/MarketPlace/utils/marketplaceModel";
import { api } from "@/utils";

/**
 * Public delivery settings. Falls back to pickup-only (fee 0) while loading,
 * when the endpoint fails, or on older backends that don't expose it.
 */
export const useDeliveryConfig = () => {
  const { data, loading, error } = useFetch(
    api.fetch.fetchDeliveryConfig,
    undefined,
    false,
    { silent: true }
  );
  const config = !error ? data?.data : undefined;
  const fee = Math.max(0, Number(config?.delivery_fee) || 0);

  return {
    loading,
    deliveryEnabled: Boolean(config?.delivery_enabled),
    deliveryFee: fee,
    pickupLocation: config?.pickup_location?.trim() || PICKUP_LOCATION,
  };
};
