import { StateCreator } from "zustand";
import { MemberSlice } from "../utils/membersInterfaces";

export const createMemberSlice: StateCreator<
  MemberSlice,
  [],
  [],
  MemberSlice
> = (set) => ({
  // members: [],
  total: 0,
  membersOptions: [],
  userStats: {
    online: {
      total_members: 0,
      total_males: 0,
      total_females: 0,
      stats: {
        children: {
          Total: 20,
          Male: 0,
          Female: 0,
        },
        adults: {
          Total: 0,
          Male: 0,
          Female: 0,
        },
      },
    },
    inhouse: {
      total_members: 0,
      total_males: 0,
      total_females: 0,
      stats: {
        children: {
          Total: 0,
          Male: 0,
          Female: 0,
        },
        adults: {
          Total: 0,
          Male: 0,
          Female: 0,
        },
      },
    },
  },
  // addMember: (member) => {
  //   set((state) => ({
  //     members: [...state.members, member],
  //   }));
  //   get().setMemberOptions();
  // },
  // removeMember: (memberId) => {
  //   set((state) => ({
  //     members: state.members.filter((pos: UserType) => pos.id !== memberId),
  //   }));
  //   get().setMemberOptions();
  // },
  // updateMember: (updatedMember) => {
  //   set((state) => ({
  //     members: state.members.map((pos: UserType) =>
  //       pos.id === updatedMember.id ? updatedMember : pos
  //     ),
  //   }));
  //   get().setMemberOptions();
  // },
  // setMembers: (members, total) => {
  //   set({ members });
  //   set({ total });
  //   get().setMemberOptions();
  // },
  setUserStats: (userStats) => {
    set({ userStats });
  },
  setMemberOptions: (members) => {
    set(() => ({
      membersOptions: members.map((member) => ({
        label: member.name,
        value: String(member.id),
      })),
    }));
  },
});
