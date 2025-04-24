type statsType = {
    total_members: number;
    total_males: number;
    total_females: number;
    stats: {
      adults: { Male: number; Female: number; Total: number };
      children: { Male: number; Female: number; Total: number };
    };
  };
  export type UserStatsType = {
    online: statsType;
    inhouse: statsType;
  };