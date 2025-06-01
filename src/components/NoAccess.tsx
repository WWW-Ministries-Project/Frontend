import { relativePath } from "@/utils";
import { useNavigate } from "react-router-dom";
import empty from "../assets/emptyState.svg";
import { Button } from "./Button";

//TODO : Add a proper no access image
export const NoAccess = () => {
  const navigate = useNavigate();
  return (
    <div className=" flex flex-col items-center justify-center h-screen">
      <h1 className="text-2xl font-bold">No Access</h1>
      <img src={empty} alt=" no accees image" className="w-1/2" />
      <Button
        variant="primary"
        value="Go to Home"
        onClick={() => navigate(relativePath.home.main, { replace: true })}
      />
    </div>
  );
};
