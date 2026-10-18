export interface OrderFilterValues {
  product: string;
  size: string;
  colour: string;
  payment: string;
  marketStatus: string;
  date: string;
}

export const EMPTY_ORDER_FILTERS: OrderFilterValues = {
  product: "",
  size: "",
  colour: "",
  payment: "",
  marketStatus: "",
  date: "",
};

export const countOrderFilters = (f: OrderFilterValues) =>
  Object.values(f).filter(Boolean).length;
