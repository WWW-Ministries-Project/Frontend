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
 */

import { showLoader, showNotification } from "@/pages/HomePage/utils";
import { QueryType } from "@/utils/interfaces";
import { useCallback, useEffect, useState } from "react";
export const useFetch = <T,>(
  fetchFunction: (query?: QueryType) => Promise<T>,
  query?: QueryType,
  lazy?: boolean
) => {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const fetchData = useCallback(
    async (overrideQuery?: QueryType) => {
      setError(null);
      setLoading(true);
      showLoader(true);

      try {
        const response = await fetchFunction(overrideQuery || query);
        setData(response);
        return response;
      } catch (err) {
        if (!navigator.onLine)
          showNotification(
            "You are offline. Please check your internet connection.",
            "error"
          );
        else
          setError(error instanceof Error ? error : new Error("Unknown error"));
        setError(err instanceof Error ? err : new Error("Unknown error"));
      } finally {
        setLoading(false);
        showLoader(false);
      }
    },
    [fetchFunction]
  );

  useEffect(() => {
    if (!lazy) fetchData();
  }, [fetchData, lazy]);

  return { data, loading, error, refetch: fetchData };
};
