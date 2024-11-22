import { AssetSlice, assetType } from "./assetsInterface";
const createAssetSlice = (set: any, get: any): AssetSlice => ({
  assets: [],
  addAsset: (asset) => {
    set((state: any) => ({
      assets: [...state.assets, asset],
    }));
  },
  removeAsset: (assetId) => {
    set((state: any) => ({
      assets: state.assets.filter((asset: assetType) => asset.id !== assetId),
    }));
  },
  updateAsset: (updatedAsset) => {
    set((state: any) => ({
      assets: state.assets.map((asset: assetType) =>
        asset.id === updatedAsset.id ? updatedAsset : asset
      ),
    }));
  },
  setAssets: (assets) => {
    set({ assets });
  },
});

export default createAssetSlice;
