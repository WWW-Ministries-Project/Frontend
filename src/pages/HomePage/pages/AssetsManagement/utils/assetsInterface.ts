export interface assetType {
    poster: string;
    name: string;
    status: string;
    id: number;
    start_date: Date;
    end_date: string;
    start_time: string;
    end_time: string;
    description: string;
    date_purchased: string;
    department_assigned: string;
}

export interface AssetOptionsType {
    name: string;
    value: number;
}
export interface AssetSlice {
    assets: assetType[];
    addAsset: (Asset: assetType) => void;
    removeAsset: (AssetId: number) => void;
    updateAsset: (updatedAsset: assetType) => void;
    setAssets: (assetTypes: assetType[]) => void;
  }