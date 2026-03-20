import axios from "@/axiosInstance";
import { relativePath } from "@/utils";
import { AxiosError } from "axios";
import {
  ChangeEvent,
  FocusEvent,
  FormEvent,
  useEffect,
  useMemo,
  useState,
} from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Button } from "../../../../components";
import InputPassword from "../../../../components/Password";
import AuthenticationForm from "../../components/AuthenticationForm";
import NotificationCard from "../../components/NotificationCard";
import OuterDiv from "../../components/OuterDiv";
import { getRetryAfterSecondsFromError } from "../../utils/rateLimit";
import { validate } from "../../utils/helpers";
import BackgroundWrapper from "@/Wrappers/BackgroundWrapper";

interface PasswordValues {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

interface FieldErrors {
  currentPassword?: string;
  newPassword?: string;
  confirmPassword?: string;
}

interface AuthResponse {
  status?: number;
  data?: Record<string, unknown> | string;
}

const initialValues: PasswordValues = {
  currentPassword: "",
  newPassword: "",
  confirmPassword: "",
};

const getResponseMessage = (data: AuthResponse["data"]): string | undefined => {
  if (!data) return undefined;
  if (typeof data === "string") return data;
  const possibleMessage = data.message || data.error || data.detail;
  return typeof possibleMessage === "string" ? possibleMessage : undefined;
};

function ChangePassword() {
  const [passwordValues, setPasswordValues] =
    useState<PasswordValues>(initialValues);
  const [response, setResponse] = useState<AuthResponse>({});
  const [errors, setErrors] = useState<FieldErrors>({});
  const [touched, setTouched] = useState<Record<keyof PasswordValues, boolean>>(
    {
      currentPassword: false,
      newPassword: false,
      confirmPassword: false,
    }
  );
  const [loading, setLoading] = useState(false);
  const [retryAfterSeconds, setRetryAfterSeconds] = useState<number>(0);

  const navigate = useNavigate();
  const location = useLocation();
  const isRateLimited = retryAfterSeconds > 0;

  const returnPath = useMemo(() => {
    const stateValue = (location.state as { from?: unknown } | null)?.from;
    const normalized =
      typeof stateValue === "string" ? stateValue.trim() : "";

    if (normalized && normalized !== "/change-password") {
      return normalized;
    }

    return relativePath.home.main;
  }, [location.state]);

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
      "Unable to change password. Please try again.",
    [response.data]
  );

  function validateField(name: keyof PasswordValues, values: PasswordValues): string {
    if (name === "currentPassword" && !values.currentPassword.trim()) {
      return "Current password is required";
    }

    if (name === "newPassword") {
      if (!values.newPassword.trim()) return "New password is required";
      if (
        !validate("password1", {
          password1: values.newPassword,
        })
      ) {
        return "Enter a valid password";
      }
      if (values.currentPassword && values.newPassword === values.currentPassword) {
        return "New password must be different from current password";
      }
    }

    if (name === "confirmPassword") {
      if (!values.confirmPassword.trim()) return "Confirm your new password";
      if (values.newPassword !== values.confirmPassword) {
        return "Passwords do not match";
      }
    }

    return "";
  }

  function validateForm(values: PasswordValues): FieldErrors {
    return {
      currentPassword: validateField("currentPassword", values),
      newPassword: validateField("newPassword", values),
      confirmPassword: validateField("confirmPassword", values),
    };
  }

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (loading || isRateLimited) return;

    const validationErrors = validateForm(passwordValues);
    setTouched({
      currentPassword: true,
      newPassword: true,
      confirmPassword: true,
    });
    setErrors(validationErrors);

    if (
      validationErrors.currentPassword ||
      validationErrors.newPassword ||
      validationErrors.confirmPassword
    ) {
      return;
    }

    setResponse({});
    setLoading(true);

    try {
      const changePasswordResponse = await axios.post("user/change-password", {
        current_password: passwordValues.currentPassword,
        newpassword: passwordValues.newPassword,
      });

      setResponse({
        status: changePasswordResponse.status,
        data: changePasswordResponse.data,
      });
      setPasswordValues(initialValues);
    } catch (error: unknown) {
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

    if (name === "newPassword" && touched.confirmPassword) {
      setErrors((prev) => ({
        ...prev,
        confirmPassword: validateField("confirmPassword", nextValues),
      }));
    }

    if (name === "currentPassword" && touched.newPassword) {
      setErrors((prev) => ({
        ...prev,
        newPassword: validateField("newPassword", nextValues),
      }));
    }
  }

  const samePassword = passwordValues.newPassword === passwordValues.confirmPassword;

  return (
    <BackgroundWrapper>
      <OuterDiv>
        {response?.status === 200 ? (
          <NotificationCard
            header="Password Updated"
            text="Your password has been changed successfully."
            src="/assets/authentication/successIcon.svg"
            imageAlt="Password update successful icon"
            bottomText="Return"
            link={returnPath}
          />
        ) : (
          <AuthenticationForm
            response={response}
            header="Change Password"
            text="Update your password to keep your account secure."
            onSubmit={handleSubmit}
            errorText={authErrorText}
          >
            <InputPassword
              label="Current Password"
              id="currentPassword"
              name="currentPassword"
              value={passwordValues.currentPassword}
              onChange={handleInputChange}
              onBlur={handleBlur}
              placeholder="Enter current password"
              autoComplete="current-password"
              required
              error={touched.currentPassword ? errors.currentPassword : ""}
              className="my-2"
            />
            <InputPassword
              label="New Password"
              id="newPassword"
              name="newPassword"
              value={passwordValues.newPassword}
              onChange={handleInputChange}
              onBlur={handleBlur}
              placeholder="Enter new password"
              autoComplete="new-password"
              required
              error={touched.newPassword ? errors.newPassword : ""}
              className="my-2"
            />
            <InputPassword
              label="Confirm New Password"
              id="confirmPassword"
              name="confirmPassword"
              value={passwordValues.confirmPassword}
              onChange={handleInputChange}
              onBlur={handleBlur}
              placeholder="Confirm new password"
              autoComplete="new-password"
              samePassword={samePassword}
              required
              error={touched.confirmPassword ? errors.confirmPassword : ""}
              className="my-2"
            />

            <div className="mt-2 flex items-center gap-2">
              <Button
                type="button"
                value="Cancel"
                variant="ghost"
                className="w-full"
                onClick={() => navigate(returnPath)}
              />
              <Button
                type="submit"
                value={
                  isRateLimited
                    ? `Retry in ${retryAfterSeconds}s`
                    : "Change Password"
                }
                variant="primary"
                loading={loading}
                disabled={loading || isRateLimited}
                className="w-full"
              />
            </div>

            {isRateLimited && (
              <p className="text-center text-xs text-primaryGray">
                Too many attempts. Please wait before trying again.
              </p>
            )}
          </AuthenticationForm>
        )}
      </OuterDiv>
    </BackgroundWrapper>
  );
}

export default ChangePassword;
