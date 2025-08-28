import axios from "axios";
import { useState, ChangeEvent, FocusEvent } from "react";
import { Link, useLocation } from "react-router-dom";
import { Button } from "../../../../components";
import InputPassword from "../../../../components/Password";
import AuthenticationForm from "../../components/AuthenticationForm";
import NotificationCard from "../../components/NotificationCard";
import OuterDiv from "../../components/OuterDiv";
import { baseUrl, validate } from "../../utils/helpers";
import BackgroundWrapper from "@/Wrappers/BackgroundWrapper";
import { ApiResponse } from "@/utils/interfaces";

interface PasswordValues {
  password1?: string;
  password2?: string;
}

interface ErrorState {
  password1?: boolean;
  password2?: boolean;
  status?: boolean;
}



function ResetPassword() {
  const [passwordValues, setPasswordValues] = useState<PasswordValues>({});
  const [response, setResponse] = useState<ApiResponse<unknown>>();
  const [error, setError] = useState<ErrorState>({});
  const [loading, setLoading] = useState(false);
  const [samePassword, setSamePassword] = useState(true);
  
  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  const token = searchParams.get("token");
  const id = searchParams.get("id");

  async function handleSubmit(e: React.MouseEvent) {
    e.preventDefault();
    if (passwordValues.password2 && samePassword) {
      setLoading(true);
      const body = { newpassword: passwordValues.password1 };
      
      try {
        const endpoint = `${baseUrl}user/reset-password?id=${id}&token=${token}`;
        const response = await axios.post(endpoint, body);
        setResponse(response);
      } catch (error: unknown) {
        console.log(error, "error");
        setResponse(error.response || {});
      } finally {
        setLoading(false);
      }
    }
  }

  function handleBlur(e: FocusEvent<HTMLInputElement>) {
    const name = e.target.name;
    const isValid = validate(name, passwordValues);
    setError((prev) => ({ ...prev, [name]: !isValid }));
    if (!isValid) e.target.setCustomValidity("Invalid format");
  }

  function checkPassword(e?: FocusEvent<HTMLInputElement>) {
    if (passwordValues.password1 === passwordValues.password2) {
      setSamePassword(true);
    } else {
      setSamePassword(false);
      if (e) e.target.setCustomValidity("Passwords don't match");
    }
  }

  function handleInputChange(e: ChangeEvent<HTMLInputElement>) {
    setResponse({});
    const name = e.target.name;
    const value = e.target.value;
    
    setPasswordValues((prev) => ({ ...prev, [name]: value }));
    
    // to remove error msg
    if (error[name]) {
      if (validate(name, passwordValues)) {
        setError((prev) => ({ ...prev, [name]: false }));
        e.target.setCustomValidity("");
      }
    }
    
    // checks if confirm password contains values and if user is done typing once before
    if (passwordValues.password2 && !samePassword) {
      checkPassword();
    }
  }

  return (
    <BackgroundWrapper>
      <OuterDiv>
        {response.status == 200 ? (
          <div className="pt-1 authForm rounded-lg mx-auto bg-wwmBlue">
            <NotificationCard
              className={""}
              header="New Password Set"
              text="Your new password has been set successfully. Proceed to login with your new password"
              src={"/assets/authentication/successIcon.svg"}
            />
          </div>
        ) : (
          <AuthenticationForm
            response={response}
            header={"Set new password!"}
            text={"Enter a new password for your account."}
            buttonValue={"Login"}
          >
            <InputPassword
              label="New Password"
              id="password1"
              name="password1"
              value={passwordValues.password1 || ""}
              isRequired={error.status && !passwordValues.password1}
              onChange={handleInputChange}
              onBlur={handleBlur}
              placeholder={"New Password"}
              inputClass={
                error.status
                  ? "h-8 rounded-md px-4 mt-2 border-error"
                  : "h-8 rounded-md px-4 mt-2"
              }
              className="!p-0 my-4"
            />
            <InputPassword
              label="Confirm New Password"
              id="password2"
              name="password2"
              value={passwordValues.password2 || ""}
              isRequired={error.status && !passwordValues.password2}
              samePassword={samePassword}
              onChange={handleInputChange}
              onBlur={checkPassword}
              placeholder={"Confirm Password"}
              inputClass={
                error.status
                  ? "h-8 rounded-md px-4 mt-2 border-error"
                  : "h-8 rounded-md px-4 mt-2"
              }
              className="!p-0"
            />
            <Button
              value={"Set New Password"}
              variant="secondary"
              onClick={handleSubmit}
              loading={loading}
              disabled={!samePassword || loading}
              className={"w-full h-[38px] border-white my-8 text-white"}
            />
            <div>
              <div className="text-gray text-center text-sma">
                <Link to="/login" className="text-white font-bold">
                  Return to Login
                </Link>
              </div>
            </div>
          </AuthenticationForm>
        )}
      </OuterDiv>
    </BackgroundWrapper>
  );
}

export default ResetPassword;