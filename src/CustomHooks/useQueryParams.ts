import { useState } from "react";
import { useSearchParams } from "react-router-dom";

export interface QueryParamsConfig {
  [key: string]: string;
}

export function useQueryParams(paramNames: string[]) {
  const [searchParams, setSearchParams] = useSearchParams();

  // Initialize state from URL parameters
  const initialParams: QueryParamsConfig = {};
  paramNames.forEach((param) => {
    initialParams[param] = searchParams.get(param) || "";
  });

  const [params, setParams] = useState<QueryParamsConfig>(initialParams);

  // Update a single parameter
  const updateParam = (paramName: string, value: string) => {
    setParams((prev) => ({ ...prev, [paramName]: value }));

    const newSearchParams = new URLSearchParams(searchParams);

    if (value.trim()) {
      newSearchParams.set(paramName, value);
    } else {
      newSearchParams.delete(paramName);
    }

    // Reset to page 1 when any parameter changes
    newSearchParams.set("page", "1");

    setSearchParams(newSearchParams, { replace: true });
  };

  // Update multiple parameters at once
  const updateParams = (updates: QueryParamsConfig) => {
    setParams((prev) => ({ ...prev, ...updates }));

    const newSearchParams = new URLSearchParams(searchParams);

    Object.entries(updates).forEach(([key, value]) => {
      if (value.trim()) {
        newSearchParams.set(key, value);
      } else {
        newSearchParams.delete(key);
      }
    });

    // Reset to page 1 when parameters change
    newSearchParams.set("page", "1");

    setSearchParams(newSearchParams, { replace: true });
  };

  // Clear specific parameter
  const clearParam = (paramName: string) => {
    updateParam(paramName, "");
  };

  // Clear all tracked parameters
  const clearAllParams = () => {
    const clearedParams: QueryParamsConfig = {};
    paramNames.forEach((param) => {
      clearedParams[param] = "";
    });
    setParams(clearedParams);

    const newSearchParams = new URLSearchParams(searchParams);
    paramNames.forEach((param) => {
      newSearchParams.delete(param);
    });
    newSearchParams.set("page", "1");

    setSearchParams(newSearchParams, { replace: true });
  };

  return {
    params,
    updateParam,
    updateParams,
    clearParam,
    clearAllParams,
  };
}
