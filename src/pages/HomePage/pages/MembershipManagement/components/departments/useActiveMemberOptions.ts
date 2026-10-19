import { useMemo } from "react";

import { useFetch } from "@/CustomHooks/useFetch";
import { useStore } from "@/store/useStore";
import { api } from "@/utils/api/apiCalls";

export interface MemberOption {
  value: string;
  label: string;
}

/**
 * Members who can be picked for a department (head, new member). Loads
 * `list-users-light` while `enabled` and keeps active members only; until it
 * loads (or if it fails) the shell's member options are used.
 */
export const useActiveMemberOptions = (enabled: boolean): MemberOption[] => {
  const shellOptions = useStore((state) => state.membersOptions);
  const { data } = useFetch(api.fetch.fetchMembersForOptions, undefined, !enabled, {
    silent: true,
  });

  return useMemo(() => {
    if (Array.isArray(data?.data)) {
      return data.data
        .filter((member) => member.is_active !== false)
        .map((member) => ({ value: String(member.id), label: member.name }));
    }
    return shellOptions.map((option) => ({
      value: String(option.value),
      label: String(option.label),
    }));
  }, [data, shellOptions]);
};
