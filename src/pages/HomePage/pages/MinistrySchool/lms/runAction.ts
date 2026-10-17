import { showNotification } from "@/pages/HomePage/utils";

const messageOf = (error: unknown, fallback: string) => {
  const e = error as { response?: { data?: { message?: string } }; message?: string } | null;
  return e?.response?.data?.message || e?.message || fallback;
};

/** Runs an LMS mutation with consistent success / error notifications. Returns true on success. */
export const runAction = async (
  action: () => Promise<unknown>,
  { success, failure }: { success?: string; failure: string }
): Promise<boolean> => {
  try {
    await action();
    if (success) showNotification(success, "success");
    return true;
  } catch (error) {
    showNotification(messageOf(error, failure), "error");
    return false;
  }
};
