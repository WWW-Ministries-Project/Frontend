import { AssetSlice, assetType } from "./assetsInterface";
const createAssetSlice = (set: any, get: any): AssetSlice => ({
  assets: [],
  activeAsset: {},
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
  setActiveAsset: (asset) => {
    set({ activeAsset: asset });
  }
});

export default createAssetSlice;
