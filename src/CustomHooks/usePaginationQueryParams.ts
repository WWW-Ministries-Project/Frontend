import { useEffect } from "react";
import { useSearchParams } from "react-router-dom";

const DEFAULT_PAGE = 1;
const DEFAULT_TAKE = 10;

export function usePaginationQueryParams(
  defaultTake = DEFAULT_TAKE,
  defaultPage = DEFAULT_PAGE
) {
  const [searchParams, setSearchParams] = useSearchParams();

  const pageParam = searchParams.get("page");
  const takeParam = searchParams.get("take");

  const hasPage = pageParam !== null;
  const hasTake = takeParam !== null;

  const page = hasPage ? Math.max(Number(pageParam), 1) : defaultPage;
  const take = hasTake ? Math.max(Number(takeParam), 1) : defaultTake;

  const setPage = (newPage: number) => {
    const safePage = Math.max(newPage, 1);
    const newParams = new URLSearchParams(searchParams);
    newParams.set("page", safePage.toString());
    setSearchParams(newParams, { replace: true });
  };

  const setTake = (newTake: number) => {
    const newParams = new URLSearchParams(searchParams);
    newParams.set("take", Math.max(newTake, 1).toString());
    newParams.set("page", "1"); 
    setSearchParams(newParams, { replace: true });
  };

useEffect(() => {
  if (!hasPage || !hasTake) {
    const newParams = new URLSearchParams(searchParams);
    if (!hasPage) newParams.set("page", defaultPage.toString());
    if (!hasTake) newParams.set("take", defaultTake.toString());
    setSearchParams(newParams, { replace: true });
  } else if (take !== defaultTake) {
    setTake(defaultTake);
  }
}, [hasPage, hasTake, defaultPage, defaultTake]);

  return {
    page,
    take,
    setPage,
    setTake,
  };
}
