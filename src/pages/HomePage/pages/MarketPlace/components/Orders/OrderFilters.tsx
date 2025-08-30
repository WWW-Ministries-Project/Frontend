import { ChangeEvent, useEffect, useMemo } from "react";

import { SearchBar } from "@/components/SearchBar";
import { useFetch } from "@/CustomHooks/useFetch";
import Filter from "@/pages/HomePage/Components/reusable/Filter";
import { api } from "@/utils";

export function OrderFilters({
  onChange,
  showSearch,
  searchValue,
  showFilter,
}: {
  onChange: (name: string, value: string) => void;
  showSearch: boolean;
  searchValue: string;
  showFilter: boolean;
}) {
  const handleChange = function (name: string, value: string) {
    onChange(value, name);
  };

  const handleSearch = (e: ChangeEvent<HTMLInputElement>) => {
    onChange("name", e.target.value);
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
  }, [categories]);

  useEffect(() => {
    if (showFilter) {
      refetchTypes();
      refetchCategories();
    }
  }, [showFilter]);

  return (
    <div className="flex flex-col md:flex-row items-end justify-between gap-2 mb-5">
      <div className={`${showSearch ? "block" : "hidden"} w-full`}>
        <SearchBar
          className="h-10 w-full "
          placeholder="Search product name here..."
          value={searchValue}
          onChange={handleSearch}
        />
      </div>
      {showFilter && (
        <div className="flex flex-col sm:flex-row items-center gap-5 w-full">
          <div className="w-full">
            <span className="text-sm">Product Type</span>
            <Filter
              name="product_type"
              className="w-full"
              options={productTypes || []}
              onChange={handleChange}
              placeholder="Select product type"
            />
          </div>
          <div className="w-full">
            <div className="text-sm">Product Category</div>
            <Filter
              name="product_category"
              className="w-full"
              options={productCategories || []}
              onChange={handleChange}
              placeholder="Select product category"
            />
          </div>
        </div>
      )}
    </div>
  );
}
