import { useState } from "react";
import { useSearchParams } from "react-router-dom";

export function useSearchQueryParams() {
  const [searchParams, setSearchParams] = useSearchParams();

  const searchQuery = searchParams.get("search") || "";

  const [inputValue, setInputValue] = useState(searchQuery);
  const [submittedValue, setSubmittedValue] = useState(searchQuery);

  const setSearch = (value: string) => {
    setSubmittedValue(value);
    const newParams = new URLSearchParams(searchParams);

    if (value.trim()) {
      newParams.set("search", value);
    } else {
      newParams.delete("search");
    }

    // Reset to page 1 when searching
    newParams.set("page", "1");

    setSearchParams(newParams, { replace: true });
  };

  const clearSearch = () => {
    setInputValue("");
    setSearch("");
  };

  return {
    inputValue,
    setInputValue,
    submittedValue,
    setSearch,
    clearSearch,
  };
}
