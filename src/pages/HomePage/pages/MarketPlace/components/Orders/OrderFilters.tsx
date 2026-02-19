import { ChangeEvent, useEffect, useMemo } from "react";

import { SearchBar } from "@/components/SearchBar";
import { useFetch } from "@/CustomHooks/useFetch";
import Filter from "@/pages/HomePage/Components/reusable/Filter";
import { api, PaymentStatus } from "@/utils";
import { ColorSelectField } from "@/pages/HomePage/Components/reusable/ColorSelectField";

interface IProps {
  onChange: (name: string, value: string) => void;
  showSearch: boolean;
  searchValue: string;
  showFilter: boolean;
  colors: string[];
  sizes: { label: string; value: string }[];
  selectedColor?: string;
  selectedMarketStatus?: string;
  selectedOrderDate?: string;
  showOrderDateFilter?: boolean;
}
export function OrderFilters({
  onChange,
  showSearch,
  searchValue,
  showFilter,
  colors,
  sizes,
  selectedColor = "",
  selectedMarketStatus = "",
  selectedOrderDate = "",
  showOrderDateFilter = false,
}: IProps) {
  const handleChange = function (value: string, name: string) {
    onChange(name, value);
  };

  const handleSearch = (e: ChangeEvent<HTMLInputElement>) => {
    onChange("customer_name", e.target.value);
  };

  const { data: types, refetch: refetchTypes } = useFetch(
    api.fetch.fetchProductTypes,
    {},
    true
  );

  const { data: categories, refetch: refetchCategories } = useFetch(
    api.fetch.fetchProductCategories,
    {},
    true
  );

  const productCategories = useMemo(() => {
    return (
      categories?.data?.map((cat) => {
        return {
          label: cat.name,
          value: cat.name,
        };
      }) || []
    );
  }, [categories]);

  const productTypes = useMemo(() => {
    return (
      types?.data?.map((cat) => {
        return {
          label: cat.name,
          value: cat.name,
        };
      }) || []
    );
  }, [types]);

  useEffect(() => {
    if (showFilter) {
      refetchTypes();
      refetchCategories();
    }
  }, [showFilter, refetchCategories, refetchTypes]);

  const paymentStatus: {
    label: string;
    value: PaymentStatus | "";
  }[] = [
    { label: "All", value: "" },
    { label: "Pending", value: "pending" },
    { label: "Success", value: "success" },
    { label: "Failed", value: "failed" },
  ];

  const marketStatus = [
    { label: "All", value: "" },
    { label: "Active", value: "active" },
    { label: "Upcoming", value: "upcoming" },
    { label: "Ended", value: "ended" },
  ];

  return (
    <div className="flex flex-col md:flex-row items-end justify-between gap-2 mb-5">
      <div className={`${showSearch ? "block" : "hidden"} w-full`}>
        <SearchBar
          className="h-10 w-full "
          placeholder="Search customer name here..."
          value={searchValue}
          onChange={handleSearch}
        />
      </div>
      {showFilter && (
        <div className="flex flex-col sm:flex-row items-end gap-5 w-full">
          <Filter
            name="product_type"
            className="w-full"
            options={[{ label: "All", value: "" }, ...productTypes]}
            onChange={handleChange}
            placeholder="Select product type"
            label="Product Type"
          />

          <Filter
            name="product_category"
            className="w-full"
            options={[{ label: "All", value: "" }, ...productCategories]}
            onChange={handleChange}
            placeholder="Select product category"
            label="Product Category"
          />

          <Filter
            name="size"
            className="w-full"
            options={[{ label: "All", value: "" }, ...sizes]}
            onChange={handleChange}
            placeholder="Select product size"
            label="Size"
          />
          <Filter
            name="market_status"
            className="w-full"
            options={marketStatus}
            onChange={handleChange}
            placeholder="Select market status"
            label="Market"
            value={selectedMarketStatus}
          />
          <Filter
            name="payment_status"
            className="w-full"
            options={paymentStatus}
            onChange={handleChange}
            placeholder="Select payment status"
            label="Payment Status"
          />
          {showOrderDateFilter && (
            <div className="w-full">
              <label htmlFor="order_date" className="text-sm">
                Order Date
              </label>
              <input
                id="order_date"
                name="order_date"
                type="date"
                value={selectedOrderDate}
                onChange={(event) => onChange("order_date", event.target.value)}
                className="h-10 w-full border border-[#dcdcdc] bg-white rounded-lg p-1"
              />
            </div>
          )}
          {colors.length > 0 && (
            <div className="w-full">
              <ColorSelectField
                colors={colors}
                onChange={onChange}
                name="color"
                id=""
                value={selectedColor}
                label="Select color"
              />
            </div>
          )}
        </div>
      )}
    </div>
  );
}
