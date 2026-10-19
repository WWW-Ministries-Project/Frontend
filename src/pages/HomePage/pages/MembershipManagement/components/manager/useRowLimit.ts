import { useEffect, useState } from "react";

const PAGE = 50;

/** Renders long queues in chunks so thousands of rows don't mount at once. */
export const useRowLimit = <T,>(rows: T[], resetKey: string) => {
  const [limit, setLimit] = useState(PAGE);
  useEffect(() => setLimit(PAGE), [resetKey]);
  return {
    visible: rows.slice(0, limit),
    remaining: Math.max(0, rows.length - limit),
    showMore: () => setLimit((value) => value + PAGE),
  };
};
