// import { showNotification } from "@/pages/HomePage/utils";
// import { useCallback, useEffect, useState } from "react";
// export const useFetch = <T,>(
//   fetchFunction: (params?: Record<string, string | number>) => Promise<T>,
//   params?: Record<string, string | number>,
//   lazy?: boolean
// ) => {
//   const [data, setData] = useState<T | null>(null);
//   const [loading, setLoading] = useState(false);
//   const [error, setError] = useState<Error | null>(null);

//   const fetchData = useCallback(
//     async (overrideParams?: Record<string, string | number>) => {
//       setError(null);
//       setLoading(true);

//       try {
//         const response = await fetchFunction(overrideParams || params);
//         setData(response);
//         return response;
//       } catch (err) {
//         if (!navigator.onLine)
//           showNotification(
//             "You are offline. Please check your internet connection.",
//             "error"
//           );
//         else
//           setError(error instanceof Error ? error : new Error("Unknown error"));
//         setError(err instanceof Error ? err : new Error("Unknown error"));
//       } finally {
//         setLoading(false);
//       }
//     },
//     [fetchFunction]
//   );

//   useEffect(() => {
//     !lazy && fetchData();
//   }, [fetchData, lazy]);

//   return { data, loading, error, refetch: fetchData };
// };

/*
 **overrideParams: Record<string, string | number> enables us to override the params especially when refetching
 **options.silent: skip the page loader overlay — for background/shell data the current page is not waiting on
 */

/* eslint-disable react-refresh/only-export-components -- shared data-hook + cache utilities module, not a component file */
import { showLoader, showNotification } from "@/pages/HomePage/utils";
import { useBranchStore } from "@/store/useBranchStore";
import { QueryType } from "@/utils/interfaces";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

/*
 * Module-level request cache shared across every useFetch call site.
 * Purpose:
 *  - in-flight dedupe: components that mount together and request the same
 *    (fetchFunction, branch, query) share ONE network promise instead of N.
 *  - optional staleTime: serve the last response without a network round-trip
 *    while it is younger than staleTime (opt-in; default 0 keeps old behavior).
 * Keyed by the fetchFunction identity (WeakMap → auto GC) then by
 * `${branch}|${query}`. refetch() always bypasses the fresh-cache read and
 * overwrites the entry, so mutate-then-refetch flows stay correct.
 */
/**
 * Suggested staleTime presets (ms) for useFetch's 4th option arg.
 * Pass one to opt a call site into the shared cache so navigating back to a
 * page (or mounting the same list in two places) skips a redundant refetch.
 * Mutations should still call refetch() — it bypasses these and refreshes.
 */
export const STALE = {
  /** Rarely-changing reference lists: markets, departments, positions, etc. */
  reference: 5 * 60 * 1000,
  /** Near-static config: delivery config, feature flags. */
  config: 10 * 60 * 1000,
  /** Short-lived dashboards/overviews where a brief cache is acceptable. */
  short: 30 * 1000,
} as const;

type CacheEntry = { data?: unknown; ts: number; promise?: Promise<unknown> };
type AnyFetchFn = (query?: QueryType) => Promise<unknown>;
const fetchCache = new WeakMap<AnyFetchFn, Map<string, CacheEntry>>();

const getBucket = (fn: AnyFetchFn) => {
  let bucket = fetchCache.get(fn);
  if (!bucket) {
    bucket = new Map<string, CacheEntry>();
    fetchCache.set(fn, bucket);
  }
  return bucket;
};

const makeKey = (branchKey: string, query?: QueryType) =>
  branchKey + "|" + JSON.stringify(query ?? {});

/** Synchronous peek: return cached data if present and younger than staleTime. */
const readFresh = <T,>(
  fn: AnyFetchFn,
  branchKey: string,
  query: QueryType | undefined,
  staleTime: number
): T | undefined => {
  if (staleTime <= 0) return undefined;
  const bucket = fetchCache.get(fn);
  if (!bucket) return undefined;
  const entry = bucket.get(makeKey(branchKey, query));
  if (entry && entry.data !== undefined && Date.now() - entry.ts < staleTime) {
    return entry.data as T;
  }
  return undefined;
};

/**
 * Shared cache core used by both useFetch and cachedFetch.
 * Handles the fresh-cache read, in-flight dedupe, and cache write. Throws on
 * network failure (callers layer their own error/loading handling on top).
 */
const coreFetch = async <T,>(
  fn: (query?: QueryType) => Promise<T>,
  branchKey: string,
  query: QueryType | undefined,
  staleTime: number,
  force: boolean
): Promise<T> => {
  const bucket = getBucket(fn);
  const key = makeKey(branchKey, query);
  const entry = bucket.get(key);

  if (
    !force &&
    staleTime > 0 &&
    entry &&
    entry.data !== undefined &&
    Date.now() - entry.ts < staleTime
  ) {
    return entry.data as T;
  }

  // Reuse an in-flight promise for the same key (dedupe), unless forcing.
  const reuse = !force && entry?.promise;
  const promise = reuse ? (entry!.promise as Promise<T>) : fn(query);
  if (!reuse) {
    bucket.set(key, { data: entry?.data, ts: entry?.ts ?? 0, promise });
  }
  try {
    const data = await promise;
    bucket.set(key, { data, ts: Date.now() });
    return data;
  } catch (err) {
    // Clear the failed promise but keep any previously cached data/ts.
    const current = bucket.get(key);
    if (current?.promise) bucket.set(key, { data: current.data, ts: current.ts });
    throw err;
  }
};

const currentBranchKey = () =>
  String(useBranchStore.getState().activeBranchId);

/**
 * Cache-aware fetch for direct (non-hook) `api.fetch.*` calls inside effects or
 * callbacks. Shares the same cache bucket as useFetch (keyed by fn identity +
 * active branch + query), so a direct call and a hook call dedupe each other.
 * Defaults to STALE.reference; pass `force` after a mutation to refresh.
 */
export const cachedFetch = <T,>(
  fn: (query?: QueryType) => Promise<T>,
  query?: QueryType,
  options?: { staleTime?: number; force?: boolean }
): Promise<T> =>
  coreFetch<T>(
    fn,
    currentBranchKey(),
    query,
    options?.staleTime ?? STALE.reference,
    options?.force ?? false
  );

/** Drop cached entries for a fetchFunction (all keys, or one branch|query key). */
export const invalidateFetchCache = (
  fetchFunction: AnyFetchFn,
  key?: string
) => {
  const bucket = fetchCache.get(fetchFunction);
  if (!bucket) return;
  if (key) bucket.delete(key);
  else bucket.clear();
};

export const useFetch = <T,>(
  fetchFunction: (query?: QueryType) => Promise<T>,
  query?: QueryType,
  lazy?: boolean,
  options?: { silent?: boolean; staleTime?: number }
) => {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const activeBranchId = useBranchStore((state) => state.activeBranchId);
  const querySignature = useMemo(() => JSON.stringify(query ?? {}), [query]);
  const branchSignature = String(activeBranchId);
  const queryRef = useRef<QueryType | undefined>(query);
  const hasFetchedRef = useRef(false);
  const silent = options?.silent ?? false;
  const staleTime = options?.staleTime ?? 0;

  useEffect(() => {
    queryRef.current = query;
  }, [querySignature, query]);

  const runFetch = useCallback(
    async (overrideQuery?: QueryType, force = false) => {
      const effectiveQuery = overrideQuery ?? queryRef.current;

      // Serve a fresh cached response without touching the network or loader.
      if (!force) {
        const cached = readFresh<T>(
          fetchFunction,
          branchSignature,
          effectiveQuery,
          staleTime
        );
        if (cached !== undefined) {
          setData(cached);
          setError(null);
          hasFetchedRef.current = true;
          return cached;
        }
      }

      setError(null);
      setLoading(true);
      if (!silent) showLoader(true);

      try {
        const response = await coreFetch<T>(
          fetchFunction,
          branchSignature,
          effectiveQuery,
          staleTime,
          force
        );
        setData(response);
        hasFetchedRef.current = true;
        return response;
      } catch (err) {
        if (!navigator.onLine) {
          showNotification(
            "You are offline. Please check your internet connection.",
            "error"
          );
        }
        setError(err instanceof Error ? err : new Error("Unknown error"));
      } finally {
        setLoading(false);
        if (!silent) showLoader(false);
      }
    },
    [fetchFunction, silent, staleTime, branchSignature]
  );

  // Public refetch always forces a fresh network request and updates the cache.
  const refetch = useCallback(
    (overrideQuery?: QueryType) => runFetch(overrideQuery, true),
    [runFetch]
  );

  useEffect(() => {
    if (!lazy || hasFetchedRef.current) runFetch();
  }, [runFetch, lazy, querySignature, branchSignature]);

  return { data, loading, error, refetch };
};
