import { useEffect, useState } from "react";

/** A sheet's search text, cleared each time the sheet opens. */
export const useSheetQuery = (open: boolean) => {
  const [query, setQuery] = useState("");
  useEffect(() => {
    if (open) setQuery("");
  }, [open]);
  return [query, setQuery] as const;
};
