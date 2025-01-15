export interface countryType {
  name: string;
  countryCode: string;
  dialCode: string;
  initials: string;
  flag: string;
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
