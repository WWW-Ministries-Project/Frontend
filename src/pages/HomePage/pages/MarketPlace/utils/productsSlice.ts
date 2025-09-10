import type { IProductSlice } from "@/utils";

const createProductSlice = (set): IProductSlice => ({
  products: [],
  loading: false,
  error: null,
  setProducts: (products) => {
    set({ products });
  },
  setLoading: (loading) => {
    set({ loading });
  },
  setError: (error) => {
    set({ error });
  },
});

export default createProductSlice;
