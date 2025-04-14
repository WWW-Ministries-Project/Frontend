import { MemberSlice, UserType } from "../utils/membersInterfaces";

const createMemberSlice = (set: any, get: any): MemberSlice => ({
  members: [],
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
  addMember: (member) => {
    set((state: any) => ({
      members: [...state.members, member],
    }));
    get().setMemberOptions();
  },
  removeMember: (memberId) => {
    set((state: any) => ({
      members: state.members.filter((pos: UserType) => pos.id !== memberId),
    }));
    get().setMemberOptions();
  },
  updateMember: (updatedMember) => {
    set((state: any) => ({
      members: state.members.map((pos: UserType) =>
        pos.id === updatedMember.id ? updatedMember : pos
      ),
    }));
    get().setMemberOptions();
  },
  setMembers: (members) => {
    set({ members });
    get().setMemberOptions();
  },
  setUserStats: (userStats) => {
    set({ userStats });
  },
  setMemberOptions: () => {
    set((state: any) => ({
      membersOptions: state.members.map((member: UserType) => ({
        name: member.name,
        value: member.id,
      })),
    }));
  },
});

export default createMemberSlice;
