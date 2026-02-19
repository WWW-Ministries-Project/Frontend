import { useContext } from "react";
import { ViewPageContext } from "./viewPageContext.shared";

export const useViewPage = () => {
  const context = useContext(ViewPageContext);
  if (!context) {
    throw new Error("useViewPage must be used within ViewPageProvider");
  }
  return context;
};
