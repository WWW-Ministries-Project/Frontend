import axios, { AxiosResponse, AxiosError } from "axios";
import { useState, ChangeEvent, FocusEvent, FormEvent } from "react";
import { Link } from "react-router-dom";
import { Button } from "../../../../components";
import Input from "../../../../components/Input";
import AuthenticationForm from "../../components/AuthenticationForm";
import NotificationCard from "../../components/NotificationCard";
import OuterDiv from "../../components/OuterDiv";
import { baseUrl, validate } from "../../utils/helpers";
import BackgroundWrapper from "@/Wrappers/BackgroundWrapper";
import { ApiResponse } from "@/utils/interfaces";

interface EmailValue {
  email?: string;
}

interface ErrorState {
  email?: boolean;
  status?: boolean;
}



const ForgotPassword = () => {
  const [emailValue, setEmailValue] = useState<EmailValue>({});
  const [response, setResponse] = useState<ApiResponse>({});
  const [error, setError] = useState<ErrorState>({});
  const [loading, setLoading] = useState<boolean>(false);

  function handleSubmit(e: FormEvent) {
    setLoading(true);
    (async () => {
      try {
        const endpoint = baseUrl + "user/forgot-password";
        const response: AxiosResponse = await axios.post(endpoint, emailValue);
        setResponse(response);
      } catch (error) {
        const axiosError = error as AxiosError;
        console.log(axiosError, "error");
        setResponse({ status: axiosError.response?.status, data: axiosError.response?.data });
      } finally {
        setLoading(false);
      }
    })();
  }

  function handleBlur(e: FocusEvent<HTMLInputElement>) {
    const name = e.target.name;
    const isValid = validate(name, emailValue);
    setError((prev) => ({ ...prev, [name]: !isValid }));
    !isValid && e.target.setCustomValidity("Invalid format");
  }

  function handleInputChange(e: ChangeEvent<HTMLInputElement>) {
    setResponse({});
    const name = e.target.name;
    const value = e.target.value;
    setEmailValue((prev) => ({ ...prev, [name]: value }));
    
    // to remove error msg
    if (error[name]) {
      if (validate(name, { ...emailValue, [name]: value })) {
        setError((prev) => ({ ...prev, [name]: false }));
        e.target.setCustomValidity("");
      }
    }
  }

  return (
        <BackgroundWrapper>
        <OuterDiv>
          {response.status == 200 ? (
            <div className="authForm mx-auto">
              <NotificationCard
                header="Email sent!"
                text="We have sent a password to reset your email. Check your spam
                folder if you can't find it."
                bottomText="Return to Login"
                src={"/assets/authentication/messageIcon.svg"}
                link={"/login"}
              />
            </div>
          ) : (
            <AuthenticationForm
              response={response}
              header={"Forgot Password"}
              text={"Enter your email, we'll send you a password reset link."}
              handleSubmit={handleSubmit}
              errorText={"email not found"}
            >
              <Input
                label="Email"
                labelClassName={"text-white"}
                type="email"
                id="mail"
                name="email"
                value={emailValue.email || ""}
                isRequired={error.status && !emailValue?.email}
                onChange={handleInputChange}
                onBlur={handleBlur}
                placeholder={"Enter Email Address"}
                inputClass={
                  error.status
                    ? " h-8 rounded-md px-4 mt-2 border-error"
                    : " h-8 rounded-md px-4 mt-2"
                }
                className="my-4 !p-0"
              />
              <Button
                variant="secondary"
                value={"Send password reset email"}
                onClick={handleSubmit}
                loading={loading}
                disabled={loading || error.email}
                className={`w-full h-[38px] border border-white my-8 text-white ${
                  loading || error.email ? "text-gray-600 cursor-not-allowed" : ""
                }`}
              />
              <div className="mx-auto">
                <div className="text-white text-center text-sma font-bold">
                  <Link to="/login">Return to login</Link>
                </div>
              </div>
            </AuthenticationForm>
          )}
        </OuterDiv>
      </BackgroundWrapper>
  );
};

export default ForgotPassword;