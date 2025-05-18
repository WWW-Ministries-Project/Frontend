export interface assetType {
    photo: string;
    name: string;
    status: string;
    id: number | string;
    start_date: string;
    end_date: string;
    description: string;
    date_purchased: string;
    department_assigned: string;
    price: string;
    supplier: string;
    assets_id: string;
}

export interface AssetOptionsType {
    name: string;
    value: number;
}
export interface AssetSlice {
    assets: assetType[];
    activeAsset: assetType;
    addAsset: (Asset: assetType) => void;
    removeAsset: (AssetId: number | string) => void;
    updateAsset: (updatedAsset: assetType) => void;
    setAssets: (assetTypes: assetType[]) => void;
    setActiveAsset: (asset: assetType) => void;
  }