import type { ReactNode } from "react";
import { createContext } from "react";
import { Topic, User } from "@/utils";

export type ViewPageData = {
  title?: string;
  description?: string;
  showTopic?: boolean;
  topics?: Topic[];
  user?: User;
};

export interface ViewPageContextProps {
  loading: boolean;
  setLoading: (loading: boolean) => void;
  data?: ViewPageData;
  setData?: (data: ViewPageData) => void;
  details?: ReactNode;
  setDetails?: (details: ReactNode) => void;
}

export const ViewPageContext = createContext<ViewPageContextProps | undefined>(
  undefined
);
