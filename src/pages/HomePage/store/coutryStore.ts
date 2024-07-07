import { create } from "zustand";
import { countryType } from "../utils/homeInterfaces";

interface CountrySlice {
  countries: countryType[];
  // addMember: (member: UserType) => void;
  setCountries: (country: countryType[]) => void;
  countryOptions: Array<{ name: string; value: string }>;
  setCountryOptions: () => void;
}

export const useCountryStore = create<CountrySlice>((set, get) => ({
  countries: [],
  countryOptions: [],
  setCountries: (countries) => {
    set(({ countries })),
      get().setCountryOptions();
  },

  setCountryOptions: () => {
    set(({ countries }) => ({
      countryOptions: countries.map((country: countryType) => ({
        name: country.name,
        value: country.name,
      })),
    }));
  },
}));
