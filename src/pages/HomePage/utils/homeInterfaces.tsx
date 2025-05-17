import { CountryCode } from "libphonenumber-js";

export interface countryType {
  name: string;
  countryCode: CountryCode;
  dialCode: string;
  initials: string;
  flag: string;
}

export interface RestCountryAPIResponse {
  name: { common: string };
  cca2: CountryCode;
  idd?: { root: string; suffixes: string[] };
  altSpellings?: string[];
  flags: { png: string };
}

export interface Currency {
  name: string;
  currency: string;
  currencies: {
    code: string;
  }[];
}
export type ISelectOption<T extends string | number = string> = {
  value: T;
  label: string;
};
