import type { IProductSlice } from "@/utils";

type ProductSliceSetter = (partial: Partial<IProductSlice>) => void;

const createProductSlice = (set: ProductSliceSetter): IProductSlice => ({
  products: [],
  loading: false,
  error: null,
  setProducts: (products: IProductSlice["products"]) => {
    set({ products });
  },
  setLoading: (loading: boolean) => {
    set({ loading });
  },
  setError: (error: Error | null) => {
    set({ error });
  },
});

export default createProductSlice;
