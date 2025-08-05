import { relativePath } from "@/utils";
import { useState, ChangeEvent, FocusEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios, { pictureInstance } from "../../../../axiosInstance";
import { Button } from "../../../../components";
import Input from "../../../../components/Input";
import InputPassword from "../../../../components/Password";
import { useAuth } from "../../../../context/AuthWrapper";
import { decodeToken, setToken } from "../../../../utils/helperFunctions";
import AuthenticationForm from "../../components/AuthenticationForm";
import OuterDiv from "../../components/OuterDiv";
import { baseUrl, validate } from "../../utils/helpers";
import BackgroundWrapper from "@/Wrappers/BackgroundWrapper";

interface LoginValues {
  email?: string;
  password?: string;
}

interface ErrorState {
  email?: boolean;
  password?: boolean;
  status?: boolean;
}

interface ApiResponse {
  status?: number;
  data?: {
    token?: string;
    [key: string]: unknown;
  };
}

function LoginPage() {
  const [loginValues, setLoginValues] = useState<LoginValues>({});
  const [response, setResponse] = useState<ApiResponse>({});
  const [error, setError] = useState<ErrorState>({});
  const [loading, setLoading] = useState<boolean>(false);

  const { login } = useAuth();
  const navigate = useNavigate();

  async function handleSubmit() {
    setLoading(true);
    try {
      const endpoint = baseUrl + "user/login";
      const response = await axios.post(endpoint, loginValues);
      setLoading(false);
      const token = response.data.token;
      
      if (token) {
        login(decodeToken(token));
        setToken(token);
        pictureInstance.defaults.headers.common['Authorization'] = `Bearer ${token}`;
        
        if (response.status === 200) {
          navigate(relativePath.home.members.mainNew);
        }
      }
    } catch (error: unknown) {
      console.log(error, "error");
      setResponse(error.response || {});
      setLoading(false);
    }
  }

  function handleBlur(e: FocusEvent<HTMLInputElement>) {
    const name = e.target.name;
    const isValid = validate(name, loginValues);
    setError((prev) => ({ ...prev, [name]: !isValid }));
    if (!isValid) e.target.setCustomValidity("Invalid format");
  }

  function handleInputChange(e: ChangeEvent<HTMLInputElement>) {
    setResponse({});
    const name = e.target.name;
    const value = e.target.value;
    
    setLoginValues((prev) => ({ ...prev, [name]: value }));
    
    // to remove error msg
    if (error[name]) {
      if (validate(name, { ...loginValues, [name]: value })) {
        setError((prev) => ({ ...prev, [name]: false }));
        e.target.setCustomValidity("");
      }
    }
  }

  return (
    <BackgroundWrapper>
        <OuterDiv>
          <div className="text-center animate-slide-up">
            <h1 className="text-2xl md:text-4xl font-bold text-white mb-4 leading-tight md:space-y-2">
              <span className="block bg-clip-text text-white">
                Welcome to the
              </span>
              <span className="block bg-clip-text text-white">
                Worldwide Word Ministries
              </span>
              <span className="block bg-clip-text text-white">
                Portal
              </span>
            </h1>
            <div className="w-24 h-1 bg-white mx-auto mb-8 rounded-full" />
          </div>
          
          <AuthenticationForm
            response={response}
            header={"Welcome back !"}
            text={"Login to your account to continue."}
            buttonValue={"Login"}
          >
            <Input
              label="Email Address"
              type="email"
              id="mail"
              name="email"
              value={loginValues.email || ""}
              isRequired={error?.status && !loginValues.email}
              onChange={handleInputChange}
              onBlur={handleBlur}
              placeholder={"Enter email address"}
              labelClassName={"text-white"}
              inputClass={
                error.status
                  ? "rounded-md px-4 mt-2 border-error"
                  : "rounded-md px-4 mt-2"
              }
              className="my-4 !p-0"
            />
            
            <InputPassword
              label="Password"
              id="password"
              name="password"
              value={loginValues.password || ""}
              isRequired={error.status && !loginValues.password}
              onChange={handleInputChange}
              onBlur={handleBlur}
              placeholder={"Enter password"}
              labelClassName={"text-white"}
              inputClass={
                error.status
                  ? "rounded-md px-4 mt-2 border-error"
                  : "rounded-md px-4 mt-2"
              }
              className="!p-0"
            />
            
            <Button
              variant="secondary"
              value={"Login"}
              loading={loading}
              disabled={loading}
              onClick={handleSubmit}
              className={"w-full border border-white my-8 text-white"}
            />
            
            <div className="text-lightGray text-sm">
              <div className="flex flex-col justify-center text-center space-y-1">
                <p>Forgot password?</p>
                <Link to="/forgot-password" className="text-primary">
                  <p className="font-bold text-white hover:underline">
                    Reset Password
                  </p>
                </Link>
              </div>
            </div>
          </AuthenticationForm>
        </OuterDiv>
      </BackgroundWrapper>
  );
}

export default LoginPage;