import { relativePath } from "@/utils";
import { useNavigate } from "react-router-dom";
import empty from "../assets/noAccess.svg";
// import empty from "../assets/emptyState.svg";
import { Button } from "./Button";

//TODO : Add a proper no access image
export const NoAccess = () => {
  const navigate = useNavigate();
  return (
    <div className=" flex flex-col items-center justify-center gap-4 h-[calc(100vh-4rem)]">
      <h1 className="text-2xl font-bold text-error">No Access</h1>
      <p className="text-lg text-center w-[30rem]">
        You do not have permission to access this page. Please contact your administrator if you believe this is an error.
      </p>
      <img src={empty} alt=" no accees image" className="w-[20rem]" />
      <Button
        variant="primary"
        value="Continue to Home"
        onClick={() => navigate(relativePath.home.main, { replace: true })}
      />
    </div>
  );
};
