import { useEffect, useState } from "react";

import { api } from "@/utils/api/apiCalls";
import { cachedFetch, STALE } from "@/CustomHooks/useFetch";

export interface MemberOption {
  id: number;
  name: string;
}

/** Light member list for people pickers. Loads once per mount. */
export const useMemberOptions = () => {
  const [members, setMembers] = useState<MemberOption[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    cachedFetch(api.fetch.fetchMembersForOptions, undefined, {
      staleTime: STALE.reference,
    })
      .then((response) => {
        if (cancelled) return;
        const list = (response.data ?? [])
          .filter((member) => member && typeof member.id === "number")
          .map((member) => ({ id: member.id, name: member.name || `Member ${member.id}` }))
          .sort((a, b) => a.name.localeCompare(b.name));
        setMembers(list);
      })
      .catch(() => undefined)
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return { members, loading };
};
