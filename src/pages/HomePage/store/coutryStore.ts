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
    const sortCountries = countries.sort((a, b) =>
      a.name.localeCompare(b.name)
    );
    // eslint-disable-next-line @typescript-eslint/no-unused-expressions
    set({ countries: sortCountries }), get().setCountryOptions();
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
