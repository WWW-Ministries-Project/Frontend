import { MembersType } from "@/utils";
import { create } from "zustand";
type userType = {
  name: string;
  email: string;
  selectedMember: MembersType | object;
};
type Action = {
  setName: (name: string) => void;
  setEmail: (email: string) => void;
  setSelectedMember: (selectedMember: MembersType) => void;
};

export const useUserStore = create<userType & Action>((set) => ({
  name: "",
  email: "",
  selectedMember: {},

  setName: (name: string) => set({ name }),
  setEmail: (email: string) => set({ email }),
  setSelectedMember: (selectedMember: MembersType) => set({ selectedMember }),
}));
