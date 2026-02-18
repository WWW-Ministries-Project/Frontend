import { useState, type ReactNode } from "react";
import { ViewPageContext, type ViewPageData } from "./viewPageContext.shared";

export const ViewPageProvider = ({ children }: { children: ReactNode }) => {
  const [loading, setLoading] = useState<boolean>(false);
  const [data, setData] = useState<ViewPageData | undefined>(undefined);
  const [details, setDetails] = useState<ReactNode>(null);

  return (
    <ViewPageContext.Provider value={{ loading, setLoading, data, setData, details, setDetails }}>
      {children}
    </ViewPageContext.Provider>
  );
};
