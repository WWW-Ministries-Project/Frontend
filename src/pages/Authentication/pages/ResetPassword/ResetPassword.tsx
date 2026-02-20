import axios from "axios";
import { ChangeEvent, FocusEvent, FormEvent, useMemo, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { Button } from "../../../../components";
import InputPassword from "../../../../components/Password";
import AuthenticationForm from "../../components/AuthenticationForm";
import NotificationCard from "../../components/NotificationCard";
import OuterDiv from "../../components/OuterDiv";
import { baseUrl, validate } from "../../utils/helpers";
import BackgroundWrapper from "@/Wrappers/BackgroundWrapper";

interface PasswordValues {
  password1: string;
  password2: string;
}

interface FieldErrors {
  password1?: string;
  password2?: string;
}

interface AuthResponse {
  status?: number;
  data?: Record<string, unknown> | string;
}

const initialValues: PasswordValues = {
  password1: "",
  password2: "",
};

const getResponseMessage = (data: AuthResponse["data"]): string | undefined => {
  if (!data) return undefined;
  if (typeof data === "string") return data;
  const possibleMessage = data.message || data.error || data.detail;
  return typeof possibleMessage === "string" ? possibleMessage : undefined;
};

function ResetPassword() {
  const [passwordValues, setPasswordValues] = useState<PasswordValues>(initialValues);
  const [response, setResponse] = useState<AuthResponse>({});
  const [errors, setErrors] = useState<FieldErrors>({});
  const [touched, setTouched] = useState<Record<keyof PasswordValues, boolean>>({
    password1: false,
    password2: false,
  });
  const [loading, setLoading] = useState(false);

  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  const token = searchParams.get("token");
  const id = searchParams.get("id");

  const hasValidResetLink = Boolean(token && id);

  const authErrorText = useMemo(
    () => getResponseMessage(response.data) || "Unable to reset password. Please request a new reset link.",
    [response.data]
  );

  function validateField(name: keyof PasswordValues, values: PasswordValues): string {
    if (name === "password1") {
      if (!values.password1.trim()) return "New password is required";
      if (!validate("password1", values)) return "Enter a valid password";
    }

    if (name === "password2") {
      if (!values.password2.trim()) return "Confirm new password";
      if (!validate("password2", values)) return "Enter a valid password";
      if (values.password1 !== values.password2) return "Passwords do not match";
    }

    return "";
  }

  function validateForm(values: PasswordValues): FieldErrors {
    return {
      password1: validateField("password1", values),
      password2: validateField("password2", values),
    };
  }

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();

    if (!hasValidResetLink) {
      setResponse({
        status: 400,
        data: { message: "This reset link is invalid or expired. Please request a new one." },
      });
      return;
    }

    const validationErrors = validateForm(passwordValues);
    setTouched({ password1: true, password2: true });
    setErrors(validationErrors);

    if (validationErrors.password1 || validationErrors.password2) {
      return;
    }

    setResponse({});
    setLoading(true);
    const body = { newpassword: passwordValues.password1 };

    try {
      const endpoint = `${baseUrl}user/reset-password?id=${id}&token=${token}`;
      const resetResponse = await axios.post(endpoint, body);
      setResponse({ status: resetResponse.status, data: resetResponse.data });
    } catch (error: unknown) {
      const axiosError = error as { response?: AuthResponse };
      setResponse(axiosError.response || {});
    } finally {
      setLoading(false);
    }
  }

  function handleBlur(e: FocusEvent<HTMLInputElement>) {
    const name = e.target.name as keyof PasswordValues;
    setTouched((prev) => ({ ...prev, [name]: true }));
    setErrors((prev) => ({
      ...prev,
      [name]: validateField(name, passwordValues),
    }));
  }

  function handleInputChange(e: ChangeEvent<HTMLInputElement>) {
    setResponse({});
    const name = e.target.name as keyof PasswordValues;
    const value = e.target.value;

    const nextValues = { ...passwordValues, [name]: value };
    setPasswordValues(nextValues);

    if (touched[name]) {
      setErrors((prev) => ({
        ...prev,
        [name]: validateField(name, nextValues),
      }));
    }

    if (name === "password1" && touched.password2) {
      setErrors((prev) => ({
        ...prev,
        password2: validateField("password2", nextValues),
      }));
    }
  }

  const samePassword = passwordValues.password1 === passwordValues.password2;

  return (
    <BackgroundWrapper>
      <OuterDiv>
        {response?.status === 200 ? (
          <NotificationCard
            header="Password Updated"
            text="Your new password has been set successfully. You can now log in with your new password."
            src="/assets/authentication/successIcon.svg"
            imageAlt="Password reset successful icon"
            bottomText="Return to login"
            link="/login"
          />
        ) : (
          <AuthenticationForm
            response={response}
            header="Set New Password"
            text="Enter a new password for your account."
            onSubmit={handleSubmit}
            errorText={authErrorText}
          >
            <InputPassword
              label="New Password"
              id="password1"
              name="password1"
              value={passwordValues.password1}
              onChange={handleInputChange}
              onBlur={handleBlur}
              placeholder="New password"
              autoComplete="new-password"
              required
              error={touched.password1 ? errors.password1 : ""}
              className="my-2"
            />
            <InputPassword
              label="Confirm New Password"
              id="password2"
              name="password2"
              value={passwordValues.password2}
              samePassword={samePassword}
              onChange={handleInputChange}
              onBlur={handleBlur}
              placeholder="Confirm new password"
              autoComplete="new-password"
              required
              error={touched.password2 ? errors.password2 : ""}
              className="my-2"
            />
            <Button
              type="submit"
              value="Set New Password"
              variant="primary"
              loading={loading}
              disabled={loading || !hasValidResetLink}
              className="mt-2 w-full"
            />
            <div className="text-center text-sm font-semibold">
              <Link to="/login" className="text-primary hover:underline">
                Return to login
              </Link>
            </div>

            {!hasValidResetLink && (
              <p className="text-center text-xs text-gray">
                Reset link is missing required parameters. Request a new password reset email.
              </p>
            )}
          </AuthenticationForm>
        )}
      </OuterDiv>
    </BackgroundWrapper>
  );
}

export default ResetPassword;
