import axios from "@/axiosInstance";
import { AxiosError, AxiosResponse } from "axios";
import {
  ChangeEvent,
  FocusEvent,
  FormEvent,
  useEffect,
  useMemo,
  useState,
} from "react";
import { Link } from "react-router-dom";
import { Button } from "../../../../components";
import Input from "../../../../components/Input";
import AuthenticationForm from "../../components/AuthenticationForm";
import NotificationCard from "../../components/NotificationCard";
import OuterDiv from "../../components/OuterDiv";
import { getRetryAfterSecondsFromError } from "../../utils/rateLimit";
import { validate } from "../../utils/helpers";
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
  const [retryAfterSeconds, setRetryAfterSeconds] = useState<number>(0);
  const isRateLimited = retryAfterSeconds > 0;

  useEffect(() => {
    if (retryAfterSeconds <= 0) return;

    const timer = window.setInterval(() => {
      setRetryAfterSeconds((previousValue) =>
        previousValue <= 1 ? 0 : previousValue - 1
      );
    }, 1000);

    return () => window.clearInterval(timer);
  }, [retryAfterSeconds]);

  const authErrorText = useMemo(
    () =>
      getResponseMessage(response.data) ||
      "Unable to process your request. Please try again.",
    [response.data]
  );

  function validateEmail(values: ForgotPasswordValues): string {
    if (!values.email.trim()) return "Email address is required";
    if (!validate("email", { email: values.email })) {
      return "Enter a valid email address";
    }
    return "";
  }

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (isRateLimited || loading) return;

    const emailError = validateEmail(emailValue);
    setTouched({ email: true });
    setErrors({ email: emailError });

    if (emailError) return;

    setResponse({});
    setLoading(true);
    try {
      const response: AxiosResponse = await axios.post(
        "user/forgot-password",
        emailValue
      );
      setResponse({ status: response.status, data: response.data });
    } catch (error) {
      const retryAfter = getRetryAfterSecondsFromError(error);
      if (retryAfter) {
        setRetryAfterSeconds((previousValue) =>
          Math.max(previousValue, retryAfter)
        );
      }

      const axiosError = error as AxiosError;
      setResponse({
        status: axiosError.response?.status,
        data: axiosError.response?.data as Record<string, unknown> | string,
      });
    } finally {
      setLoading(false);
    }
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
            text="If an account exists, a reset link has been sent."
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
              value={
                isRateLimited
                  ? `Retry in ${retryAfterSeconds}s`
                  : "Send password reset email"
              }
              loading={loading}
              disabled={loading || isRateLimited}
              className="mt-2 w-full"
            />
            {isRateLimited && (
              <p className="text-center text-xs text-primaryGray">
                Too many attempts. Please wait before trying again.
              </p>
            )}

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
