import { Topic } from "@/utils";
import React, { createContext, useContext, useState } from "react";

type Data = {
  title?: string;
  description?: string;
  showTopic?: boolean; // Optional property
  topics?: Topic[]; // Optional property
};
interface ViewPageContextProps {
  loading: boolean;
  setLoading: (loading: boolean) => void;
  data?: Data;
  setData?: (data: Data) => void; 
  details?: React.ReactNode; 
  setDetails?: (details: React.ReactNode) => void; 
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
  const [details, setDetails] = useState<React.ReactNode>(null);

  return (
    <ViewPageContext.Provider value={{ loading, setLoading, data, setData, details, setDetails }}>
      {children}
    </ViewPageContext.Provider>
  );
};
