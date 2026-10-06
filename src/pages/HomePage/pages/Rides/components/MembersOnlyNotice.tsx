import EmptyState from "@/components/EmptyState";

export const MembersOnlyNotice = () => (
  <EmptyState
    scope="page"
    msg="Ride to church is for members"
    description="Only approved church members can offer or request rides. Once your membership is confirmed, you'll find Ride to church here."
  />
);
