import { relativePath } from "@/utils";
import { ChangeEvent, FocusEvent, FormEvent, useMemo, useState } from "react";
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
  email: string;
  password: string;
}

interface FieldErrors {
  email?: string;
  password?: string;
}

interface ApiResponse {
  status?: number;
  data?: Record<string, unknown> | string;
}

const initialValues: LoginValues = {
  email: "",
  password: "",
};

const getResponseMessage = (data: ApiResponse["data"]): string | undefined => {
  if (!data) return undefined;
  if (typeof data === "string") return data;
  const possibleMessage = data.message || data.error || data.detail;
  return typeof possibleMessage === "string" ? possibleMessage : undefined;
};

function LoginPage() {
  const [loginValues, setLoginValues] = useState<LoginValues>(initialValues);
  const [response, setResponse] = useState<ApiResponse>({});
  const [errors, setErrors] = useState<FieldErrors>({});
  const [touched, setTouched] = useState<Record<keyof LoginValues, boolean>>({
    email: false,
    password: false,
  });
  const [loading, setLoading] = useState<boolean>(false);

  const { login } = useAuth();
  const navigate = useNavigate();

  const authErrorText = useMemo(
    () => getResponseMessage(response.data) || "Incorrect email or password. Please try again.",
    [response.data]
  );

  function validateField(name: keyof LoginValues, values: LoginValues): string {
    if (name === "email") {
      if (!values.email.trim()) return "Email address is required";
      if (!validate("email", { email: values.email })) {
        return "Enter a valid email address";
      }
    }

    if (name === "password" && !values.password.trim()) {
      return "Password is required";
    }

    return "";
  }

  function validateForm(values: LoginValues): FieldErrors {
    return {
      email: validateField("email", values),
      password: validateField("password", values),
    };
  }

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();

    const validationErrors = validateForm(loginValues);
    setTouched({ email: true, password: true });
    setErrors(validationErrors);

    if (validationErrors.email || validationErrors.password) {
      return;
    }

    setResponse({});
    setLoading(true);

    try {
      const endpoint = baseUrl + "user/login";
      const loginResponse = await axios.post(endpoint, loginValues);
      const token = loginResponse.data?.token as string | undefined;

      if (token) {
        const decodedToken = decodeToken(token);
        if (!decodedToken) {
          setResponse({
            status: 500,
            data: { message: "Unable to sign in. Please try again." },
          });
          return;
        }

        login(decodedToken);
        setToken(token);
        pictureInstance.defaults.headers.common.Authorization = `Bearer ${token}`;

        if (loginResponse.status === 200) {
          const userCategory = decodedToken?.user_category?.toLowerCase();
          if (
            userCategory === "admin" ||
            (userCategory !== "member" && decodedToken?.ministry_worker)
          ) {
            navigate(relativePath.home.main);
          } else {
            navigate(relativePath.member.dashboard);
          }
        }
      } else {
        setResponse({
          status: 500,
          data: { message: "Unable to sign in. Please try again." },
        });
      }
    } catch (error: unknown) {
      const axiosError = error as { response?: ApiResponse };
      setResponse(axiosError.response || {});
    } finally {
      setLoading(false);
    }
  }

  function handleBlur(e: FocusEvent<HTMLInputElement>) {
    const name = e.target.name as keyof LoginValues;
    setTouched((prev) => ({ ...prev, [name]: true }));
    setErrors((prev) => ({
      ...prev,
      [name]: validateField(name, loginValues),
    }));
  }

  function handleInputChange(e: ChangeEvent<HTMLInputElement>) {
    setResponse({});
    const name = e.target.name as keyof LoginValues;
    const value = e.target.value;

    const nextValues = { ...loginValues, [name]: value };
    setLoginValues(nextValues);

    if (touched[name]) {
      setErrors((prev) => ({
        ...prev,
        [name]: validateField(name, nextValues),
      }));
    }
  }

  return (
    <BackgroundWrapper>
      <OuterDiv>
        <AuthenticationForm
          response={response}
          header="Welcome Back"
          text="Login to your account to continue."
          onSubmit={handleSubmit}
          errorText={authErrorText}
        >
          <Input
            label="Email Address"
            type="email"
            id="email"
            name="email"
            value={loginValues.email}
            onChange={handleInputChange}
            onBlur={handleBlur}
            placeholder="Enter email address"
            autoComplete="username"
            required
            error={touched.email ? errors.email : ""}
            className="my-2"
          />

          <InputPassword
            label="Password"
            id="password"
            name="password"
            value={loginValues.password}
            onChange={handleInputChange}
            onBlur={handleBlur}
            placeholder="Enter password"
            autoComplete="current-password"
            required
            error={touched.password ? errors.password : ""}
            className="my-2"
          />

          <Button
            variant="primary"
            type="submit"
            value="Login"
            loading={loading}
            disabled={loading}
            className="mt-2 w-full"
          />

          <div className="text-sm">
            <div className="flex flex-col justify-center space-y-1 text-center">
              <p className="text-gray">Forgot password?</p>
              <Link to="/forgot-password" className="font-semibold text-primary hover:underline">
                Reset password
              </Link>
            </div>
          </div>
        </AuthenticationForm>
      </OuterDiv>
    </BackgroundWrapper>
  );
}

export default LoginPage;
