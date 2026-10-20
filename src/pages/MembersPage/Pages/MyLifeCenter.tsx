import { useFetch } from "@/CustomHooks/useFetch";
import { LifeCenterDetailView } from "@/pages/HomePage/pages/LifeCenter/LifeCenterDetail";
import { useUserStore } from "@/store/userStore";
import { api } from "@/utils/api/apiCalls";

/** Member portal: the life center the signed-in member belongs to. */
const MyLifeCenter = () => {
  const user_id = useUserStore((state) => state.id);
  const { data, loading } = useFetch(api.fetch.fetchLifeCenterByUserId, { user_id });
  const id = data?.data?.id;

  if (id) return <LifeCenterDetailView id={String(id)} leaderView />;

  return (
    <div className="app-page-padding py-6">
      {loading || !data ? (
        <div className="h-40 animate-pulse rounded-xl bg-[#F3F4F6]" />
      ) : (
        <p className="rounded-xl border border-dashed border-lightGray bg-white p-6 text-center text-sm text-[#4B5563]">
          You’re not part of a life center yet. Ask your pastor which one meets near you.
        </p>
      )}
    </div>
  );
};

export default MyLifeCenter;
