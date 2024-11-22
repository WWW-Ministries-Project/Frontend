import { create } from "zustand";
export type image = { image: string; id: number, file:File };

export type imageType = {
  images: image[];
};
type Action = {
  addImage: (image: image) => void;
  removeImage: (id:number)=>void;
};

export const useImagesStore = create<imageType & Action>((set) => ({
  images: [],
  addImage: (image) => set((state) => ({ images: [...state.images, image] })),
  removeImage: (id) => set((state) => ({ images: state.images.filter(img => img.id !== id) })),
}));
