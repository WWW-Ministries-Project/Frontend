import { useParams } from "react-router-dom";

import { useFetch } from "@/CustomHooks/useFetch";
import { LifeCenterDetailView, type LifeCenterSection } from "@/pages/HomePage/pages/LifeCenter/LifeCenterDetail";
import { useUserStore } from "@/store/userStore";
import { api } from "@/utils/api/apiCalls";

/** URL segment → section. Sections are picked from the header's More › My life center menu. */
const SECTIONS: Record<string, LifeCenterSection> = {
  meetings: "meetings",
  "souls-won": "souls",
  members: "members",
  analytics: "analytics",
};

/** Member portal: the life center the signed-in leader belongs to. */
const MyLifeCenter = () => {
  const { section } = useParams();
  const user_id = useUserStore((state) => state.id);
  const { data, loading } = useFetch(api.fetch.fetchLifeCenterByUserId, { user_id });
  const id = data?.data?.id;

  return (
    <div className="mx-auto w-full max-w-[1280px] pt-2">
      {id ? (
        <LifeCenterDetailView id={String(id)} leaderView section={SECTIONS[section ?? ""] ?? "overview"} />
      ) : (
        <div className="px-4 py-6 tablet:px-6">
          {loading || !data ? (
            <div className="h-40 animate-pulse rounded-xl bg-[#F3F4F6]" />
          ) : (
            <p className="rounded-xl border border-dashed border-lightGray bg-white p-6 text-center text-sm text-[#4B5563]">
              You’re not part of a life center yet. Ask your pastor which one meets near you.
            </p>
          )}
        </div>
      )}
    </div>
  );
};

export default MyLifeCenter;
