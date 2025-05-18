import Cookies from "js-cookie";
import { jwtDecode } from "jwt-decode";
import parsePhoneNumber from "libphonenumber-js";
import { DateTime } from "luxon";

export const getToken = () => {
  return Cookies.get("token");
};
export const setToken = (token: string) => {
  return Cookies.set("token", token, {
    expires: new Date((decodeToken(token)?.exp as number) * 1000),
  });
};
export const removeToken = () => {
  return Cookies.remove("token");
};

export const decodeToken = (
  value?: string
): Record<string, unknown> | undefined => {
  const token = value ? value : getToken();
  if (!token) return undefined;
  return jwtDecode(token);
};
export const firstLetters = (string = "No Name") => {
  string = string.length > 0 ? string : "No Name";
  const arr = string.trim().split(" ");
  let initials = "";
  if (arr[0][0]) initials += arr[0][0].toUpperCase();
  if (arr[arr.length - 1][0]) initials += arr[arr.length - 1][0].toUpperCase();

  return initials;
};

export const formatPhoneNumber = (
  countryCode: string,
  number: string
): string => {
  if (!countryCode || !number) return "-";

  // // Format number into groups of 3-4 digits for better readability
  // const formatted = number.replace(/(\d{3})(\d{3})(\d{4})/, "$1 $2 $3");
  // return `${countryCode} ${formatted}`;
  const phone = parsePhoneNumber(countryCode + number);

  if (phone?.isValid()) return phone.formatInternational();

  return "-";
};

export const formatDate = (value: string) => {
  return DateTime.fromISO(value).toLocaleString(DateTime.DATE_MED);
};
export const formatInputDate = (value: string | undefined) => {
  return value && DateTime.fromISO(value).toFormat("yyyy-MM-dd");
};

export const compareDates = (date1: string, date2 = "") => {
  const dt1 = DateTime.fromISO(date1);
  const dt2 = date2 ? DateTime.fromISO(date2) : DateTime.now();
  // console.log(dt1,"1", dt2,"2");

  if (dt1 < dt2) {
    return true;
  } else if (dt1 >= dt2) {
    return false;
  }
  // else {
  //     return 0;
  // }
};
export const genderOptions = [
  { name: "Male", value: "Male" },
  { name: "Female", value: "Female" },
];

export const getChangedValues = (
  initialValues: Record<string, unknown>,
  currentValues: Record<string, unknown>
) => {
  const changedValues: Record<string, unknown> = {};
  for (const key in currentValues) {
    if (typeof currentValues[key] == "object") continue;
    if (currentValues[key] !== initialValues[key]) {
      changedValues[key] = currentValues[key];
    }
  }
  return changedValues;
};

export function convertPermissions(permissions: Record<string, string>) {
  const result: Record<string, boolean> = {};

  const permMapping: Record<string, string> = {
    Can_View: "view",
    Can_Manage: "manage",
    Super_Admin: "admin",
  };

  for (const [key, value] of Object.entries(permissions)) {
    if (!value) continue;

    const permKey = permMapping[value];
    if (permKey) {
      const formattedKey = `${permKey}_${key.toLowerCase().replace(/ /g, "_")}`;
      result[formattedKey] = true;

      if (value === "Can_Manage") {
        const viewKey = `view_${key.toLowerCase().replace(/ /g, "_")}`;
        result[viewKey] = true;
      }

      if (value === "Super_Admin") {
        const viewKey = `view_${key.toLowerCase().replace(/ /g, "_")}`;
        const manageKey = `manage_${key.toLowerCase().replace(/ /g, "_")}`;
        result[viewKey] = true;
        result[manageKey] = true;
      }
    }
  }

  return result;
}
