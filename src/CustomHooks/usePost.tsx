import React from "react";

const UsePost = <T,>(postFunction: (payload: any) => Promise<T>) => {
  const [data, setData] = React.useState<T | null>(null);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<Error | null>(null);

  const postData = React.useCallback(async (payload: any) => {
    setError(null);
    setLoading(true);

    try {
      const response = await postFunction(payload);
      setData(response);
    } catch (error) {
      setError(error instanceof Error ? error : new Error("Unknown error"));
    } finally {
      setLoading(false);
    }
  }, [postFunction]);

  return { data, loading, error, postData };
};

export default UsePost;
