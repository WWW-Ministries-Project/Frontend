import { Topic } from "@/utils";
import React, { createContext, useContext, useState } from "react";

type Data = {
  title: string;
  description: string;
  showTopic?: boolean; // Optional property
  topics?: Topic[]; // Optional property
};
interface ViewPageContextProps {
  loading: boolean;
  setLoading: (loading: boolean) => void;
  data?: Data; // Optional data property
  setData?: (data: Data) => void; // Optional setter for data
}

const ViewPageContext = createContext<ViewPageContextProps | undefined>(
  undefined
);

export const useViewPage = () => {
  const context = useContext(ViewPageContext);
  if (!context) {
    throw new Error("useViewPage must be used within ViewPageProvider");
  }
  return context;
};

export const ViewPageProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [loading, setLoading] = useState<boolean>(false);
  const [data, setData] = useState<Data | undefined>(undefined);

  return (
    <ViewPageContext.Provider value={{ loading, setLoading, data, setData }}>
      {children}
    </ViewPageContext.Provider>
  );
};
