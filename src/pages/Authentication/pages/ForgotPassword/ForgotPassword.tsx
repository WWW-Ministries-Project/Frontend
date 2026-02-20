import axios, { AxiosResponse, AxiosError } from "axios";
import { ChangeEvent, FocusEvent, FormEvent, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "../../../../components";
import Input from "../../../../components/Input";
import AuthenticationForm from "../../components/AuthenticationForm";
import NotificationCard from "../../components/NotificationCard";
import OuterDiv from "../../components/OuterDiv";
import { baseUrl, validate } from "../../utils/helpers";
import BackgroundWrapper from "@/Wrappers/BackgroundWrapper";
interface ForgotPasswordValues {
  email: string;
}

interface FieldErrors {
  email?: string;
}

interface AuthResponse {
  status?: number;
  data?: Record<string, unknown> | string;
}

const initialValues: ForgotPasswordValues = {
  email: "",
};

const getResponseMessage = (data: AuthResponse["data"]): string | undefined => {
  if (!data) return undefined;
  if (typeof data === "string") return data;
  const possibleMessage = data.message || data.error || data.detail;
  return typeof possibleMessage === "string" ? possibleMessage : undefined;
};

const ForgotPassword = () => {
  const [emailValue, setEmailValue] = useState<ForgotPasswordValues>(initialValues);
  const [response, setResponse] = useState<AuthResponse>({});
  const [errors, setErrors] = useState<FieldErrors>({});
  const [touched, setTouched] = useState({ email: false });
  const [loading, setLoading] = useState<boolean>(false);

  const authErrorText = useMemo(
    () => getResponseMessage(response.data) || "Email address was not found.",
    [response.data]
  );

  function validateEmail(values: ForgotPasswordValues): string {
    if (!values.email.trim()) return "Email address is required";
    if (!validate("email", { email: values.email })) {
      return "Enter a valid email address";
    }
    return "";
  }

  function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();

    const emailError = validateEmail(emailValue);
    setTouched({ email: true });
    setErrors({ email: emailError });

    if (emailError) return;

    setResponse({});
    setLoading(true);
    (async () => {
      try {
        const endpoint = baseUrl + "user/forgot-password";
        const response: AxiosResponse = await axios.post(endpoint, emailValue);
        setResponse({ status: response.status, data: response.data });
      } catch (error) {
        const axiosError = error as AxiosError;
        setResponse({
          status: axiosError.response?.status,
          data: axiosError.response?.data as Record<string, unknown> | string,
        });
      } finally {
        setLoading(false);
      }
    })();
  }

  function handleBlur(e: FocusEvent<HTMLInputElement>) {
    const name = e.target.name as keyof ForgotPasswordValues;
    setTouched((prev) => ({ ...prev, [name]: true }));
    setErrors((prev) => ({
      ...prev,
      [name]: validateEmail(emailValue),
    }));
  }

  function handleInputChange(e: ChangeEvent<HTMLInputElement>) {
    setResponse({});
    const name = e.target.name as keyof ForgotPasswordValues;
    const value = e.target.value;

    const nextValues = { ...emailValue, [name]: value };
    setEmailValue(nextValues);

    if (touched[name]) {
      setErrors((prev) => ({
        ...prev,
        [name]: validateEmail(nextValues),
      }));
    }
  }

  return (
    <BackgroundWrapper>
      <OuterDiv>
        {response.status === 200 ? (
          <NotificationCard
            header="Email sent"
            text="A password reset link has been sent to your email address. Check your spam folder if you cannot find it."
            bottomText="Return to login"
            src="/assets/authentication/messageIcon.svg"
            imageAlt="Mail sent icon"
            link="/login"
          />
        ) : (
          <AuthenticationForm
            response={response}
            header="Forgot Password"
            text="Enter your email and we will send a password reset link."
            onSubmit={handleSubmit}
            errorText={authErrorText}
          >
            <Input
              label="Email Address"
              type="email"
              id="email"
              name="email"
              value={emailValue.email}
              onChange={handleInputChange}
              onBlur={handleBlur}
              placeholder="Enter email address"
              autoComplete="username"
              required
              error={touched.email ? errors.email : ""}
              className="my-2"
            />

            <Button
              variant="primary"
              type="submit"
              value="Send password reset email"
              loading={loading}
              disabled={loading}
              className="mt-2 w-full"
            />

            <div className="mx-auto text-center text-sm font-semibold">
              <Link to="/login" className="text-primary hover:underline">
                Return to login
              </Link>
            </div>
          </AuthenticationForm>
        )}
      </OuterDiv>
    </BackgroundWrapper>
  );
};

export default ForgotPassword;
