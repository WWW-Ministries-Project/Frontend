import Cookies from "js-cookie";
import { jwtDecode } from "jwt-decode";
import parsePhoneNumber from "libphonenumber-js";
import { DateTime } from "luxon";
import { userTypeWithToken } from "./interfaces";

export const getToken = () => {
  return Cookies.get("token");
};
export const setToken = (token: string) => {
  return Cookies.set("token", token, {
    expires: new Date((decodeToken(token)?.exp ?? 0) * 1000),
  });
};
export const removeToken = () => {
  return Cookies.remove("token");
};

export const decodeToken = (value?: string): userTypeWithToken | undefined => {
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
export const currentYear = new Date().getFullYear()

// Helper function to get years (5 years backwards from current)
export const getYearOptions = () => {
  const years = []
  for (let i = 0; i < 5; i++) {
    const year = currentYear - i
    years.push({ label: year.toString(), value: year.toString() })
  }
  return [{ label: "All Years", value: "all" }, ...years]
}

// Helper function to get month options
export const getMonthOptions = () => {
  const months = [
    { label: "All Months", value: "all" },
    { label: "January", value: "1" },
    { label: "February", value: "2" },
    { label: "March", value: "3" },
    { label: "April", value: "4" },
    { label: "May", value: "5" },
    { label: "June", value: "6" },
    { label: "July", value: "7" },
    { label: "August", value: "8" },
    { label: "September", value: "9" },
    { label: "October", value: "10" },
    { label: "November", value: "11" },
    { label: "December", value: "12" },
  ]
  return months
}

// Helper function to get weeks based on selected month and year
export const getWeekOptions = (month: string, year: string) => {
  if (month === "all") {
    return [{ label: "All Weeks", value: "all" }]
  }

  const selectedYear = year === "all" ? currentYear : Number.parseInt(year)
  const selectedMonth = Number.parseInt(month)

  // Get the number of days in the selected month
  const daysInMonth = new Date(selectedYear, selectedMonth, 0).getDate()

  // Calculate number of weeks (rounded up)
  const numberOfWeeks = Math.ceil(daysInMonth / 7)

  const weeks = [{ label: "All Weeks", value: "all" }]
  for (let i = 1; i <= numberOfWeeks; i++) {
    weeks.push({ label: `Week ${i}`, value: i.toString() })
  }

  return weeks
}
