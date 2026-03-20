import { relativePath } from "@/utils";
import { userTypeWithToken } from "@/utils/interfaces";
import {
  ChangeEvent,
  FocusEvent,
  FormEvent,
  useEffect,
  useMemo,
  useState,
} from "react";
import { Link, useNavigate } from "react-router-dom";
import axios, { pictureInstance } from "../../../../axiosInstance";
import { Button } from "../../../../components";
import Input from "../../../../components/Input";
import InputPassword from "../../../../components/Password";
import { useAuth } from "../../../../context/AuthWrapper";
import { decodeToken, setToken } from "../../../../utils/helperFunctions";
import AuthenticationForm from "../../components/AuthenticationForm";
import OuterDiv from "../../components/OuterDiv";
import { getRetryAfterSecondsFromError } from "../../utils/rateLimit";
import { validate } from "../../utils/helpers";
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

type PermissionCandidate = Record<string, unknown> | string[] | null | undefined;

const initialValues: LoginValues = {
  email: "",
  password: "",
};

const USER_PROFILE_FIELDS = [
  "id",
  "member_id",
  "email",
  "name",
  "phone",
  "user_category",
  "profile_img",
  "member_since",
  "membership_type",
  "ministry_worker",
  "department",
  "department_positions",
  "life_center_leader",
  "instructor",
] as const;

const getResponseMessage = (data: ApiResponse["data"]): string | undefined => {
  if (!data) return undefined;
  if (typeof data === "string") return data;
  const possibleMessage = data.message || data.error || data.detail;
  return typeof possibleMessage === "string" ? possibleMessage : undefined;
};

const asRecord = (value: unknown): Record<string, unknown> | undefined => {
  if (!value || typeof value !== "object" || Array.isArray(value)) return undefined;
  return value as Record<string, unknown>;
};

const collectCandidateRecords = (payload: unknown): Record<string, unknown>[] => {
  const root = asRecord(payload);
  if (!root) return [];

  const levelOne = asRecord(root.data);
  const levelTwo = levelOne ? asRecord(levelOne.data) : undefined;
  const candidates = [
    root,
    levelOne,
    levelTwo,
    asRecord(root.user),
    levelOne ? asRecord(levelOne.user) : undefined,
    levelTwo ? asRecord(levelTwo.user) : undefined,
  ];

  const seen = new Set<Record<string, unknown>>();
  const records: Record<string, unknown>[] = [];

  candidates.forEach((candidate) => {
    if (!candidate || seen.has(candidate)) return;
    seen.add(candidate);
    records.push(candidate);
  });

  return records;
};

const extractTokenFromPayload = (payload: unknown): string | undefined => {
  const records = collectCandidateRecords(payload);
  for (const record of records) {
    const token = record.token;
    if (typeof token === "string" && token.trim()) return token;
  }
  return undefined;
};

const extractPermissionsFromRecord = (
  record: Record<string, unknown>
): PermissionCandidate => {
  const direct = record.permissions;
  if (Array.isArray(direct) || asRecord(direct)) {
    return direct as PermissionCandidate;
  }

  const access = asRecord(record.access);
  if (access) {
    const accessPermissions = access.permissions;
    if (Array.isArray(accessPermissions) || asRecord(accessPermissions)) {
      return accessPermissions as PermissionCandidate;
    }
  }

  const accessLevel = asRecord(record.access_level);
  if (accessLevel) {
    const levelPermissions = accessLevel.permissions;
    if (Array.isArray(levelPermissions) || asRecord(levelPermissions)) {
      return levelPermissions as PermissionCandidate;
    }
  }

  return undefined;
};

const extractPermissionSources = (
  payload: unknown
): {
  permissions: PermissionCandidate;
  access_permissions: Record<string, unknown> | null | undefined;
} => {
  const records = collectCandidateRecords(payload);
  let permissions: PermissionCandidate = undefined;
  let accessPermissions: Record<string, unknown> | null | undefined = undefined;

  for (const record of records) {
    if (!accessPermissions) {
      const directAccessPermissions = asRecord(record.access_permissions);
      if (directAccessPermissions) {
        accessPermissions = directAccessPermissions;
      }
    }

    if (!permissions) {
      const extractedPermissions = extractPermissionsFromRecord(record);
      if (extractedPermissions) {
        permissions = extractedPermissions;
      }
    }

    if (permissions && accessPermissions) break;
  }

  return {
    permissions,
    access_permissions: accessPermissions,
  };
};

const extractUserProfileFromSources = (
  ...sources: unknown[]
): Partial<userTypeWithToken> => {
  const mergedProfile: Partial<userTypeWithToken> = {};

  sources.forEach((source) => {
    const records = collectCandidateRecords(source);

    records.forEach((record) => {
      USER_PROFILE_FIELDS.forEach((field) => {
        if (mergedProfile[field] !== undefined) return;
        const value = record[field];
        if (value !== undefined) {
          mergedProfile[field] = value as userTypeWithToken[typeof field];
        }
      });
    });
  });

  if (mergedProfile.id !== undefined) {
    mergedProfile.id = String(mergedProfile.id);
  }
  if (mergedProfile.member_id !== undefined && mergedProfile.member_id !== null) {
    mergedProfile.member_id = String(mergedProfile.member_id);
  }

  return mergedProfile;
};

const mergeUserPermissionSources = (
  decodedToken: userTypeWithToken,
  ...sources: unknown[]
): userTypeWithToken => {
  const profile = extractUserProfileFromSources(...sources);
  let permissions: PermissionCandidate = decodedToken.permissions;
  let accessPermissions = decodedToken.access_permissions;

  sources.forEach((source) => {
    const extracted = extractPermissionSources(source);

    if (extracted.permissions) {
      permissions = extracted.permissions;
    }

    if (extracted.access_permissions) {
      accessPermissions = extracted.access_permissions;
    }
  });

  return {
    ...decodedToken,
    ...profile,
    permissions: permissions as userTypeWithToken["permissions"],
    access_permissions: accessPermissions,
  };
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
  const [retryAfterSeconds, setRetryAfterSeconds] = useState<number>(0);

  const { login } = useAuth();
  const navigate = useNavigate();
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
    if (isRateLimited || loading) return;

    const validationErrors = validateForm(loginValues);
    setTouched({ email: true, password: true });
    setErrors(validationErrors);

    if (validationErrors.email || validationErrors.password) {
      return;
    }

    setResponse({});
    setLoading(true);

    try {
      const loginResponse = await axios.post("user/login", loginValues);
      const token = extractTokenFromPayload(loginResponse.data);

      if (token) {
        const decodedToken = decodeToken(token);
        if (!decodedToken) {
          setResponse({
            status: 500,
            data: { message: "Unable to sign in. Please try again." },
          });
          return;
        }

        setToken(token);
        pictureInstance.defaults.headers.common.Authorization = `Bearer ${token}`;
        let hydratedUser = mergeUserPermissionSources(decodedToken, loginResponse.data);

        try {
          const currentUserResponse = await axios.get("user/current-user");
          hydratedUser = mergeUserPermissionSources(
            hydratedUser,
            currentUserResponse.data
          );
        } catch {
          // Continue with token claims if profile hydration fails.
        }

        login(hydratedUser);

        if (loginResponse.status === 200) {
          const userCategory = hydratedUser?.user_category?.toLowerCase();
          if (
            userCategory === "admin" ||
            (userCategory !== "member" && hydratedUser?.ministry_worker)
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
      const retryAfter = getRetryAfterSecondsFromError(error);
      if (retryAfter) {
        setRetryAfterSeconds((previousValue) =>
          Math.max(previousValue, retryAfter)
        );
      }
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
            value={isRateLimited ? `Retry in ${retryAfterSeconds}s` : "Login"}
            loading={loading}
            disabled={loading || isRateLimited}
            className="mt-2 w-full"
          />
          {isRateLimited && (
            <p className="text-center text-xs text-primaryGray">
              Too many attempts. Please wait before trying again.
            </p>
          )}

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
