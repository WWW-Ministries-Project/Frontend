import { create } from "zustand";
import { persist } from "zustand/middleware";
import {
  countryType,
  ISelectOption,
  RestCountryAPIResponse,
} from "../utils/homeInterfaces";

interface CountrySlice {
  countries: RestCountryAPIResponse[];
  dialOptions: countryType[];
  setCountries: (country: RestCountryAPIResponse[]) => void;
  countryOptions: ISelectOption[];
  setCountryOptions: () => void;
  setDialOptions: () => void;
}

export const useCountryStore = create<CountrySlice>()(
  persist(
    (set, get) => ({
      countries: [],
      dialOptions: [],
      countryOptions: [],
      setCountries: (countries) => {
        const sortCountries = countries.sort((a, b) =>
          a.name?.common.localeCompare(b.name?.common)
        );
        set({ countries: sortCountries });
        get().setCountryOptions();
        get().setDialOptions();
      },
      setCountryOptions: () => {
        set(({ countries }) => ({
          countryOptions: countries.map((country: RestCountryAPIResponse) => ({
            label: country.name?.common ?? "Unknown",
            value: country.name?.common ?? "Unknown",
          })),
        }));
      },
      setDialOptions: () => {
        set(({ countries }) => ({
          dialOptions: countries
            .filter(
              (country) => country.idd?.root && country.idd.suffixes?.length
            )
            .flatMap((country) =>
              country.idd!.suffixes.map((suffix) => {
                const dialCode = `${country.idd!.root}${suffix}`;
                return {
                  name: country.name?.common ?? "Unknown",
                  dialCode: dialCode,
                  countryCode: country.cca2 ?? "Unknown",
                  initials: country.altSpellings?.[0] ?? "Unknown",
                  flag: country.flags.png,
                };
              })
            ),
        }));
      },
    }),

    {
      name: "country-storage",
      partialize: (state) => ({
        // countries: state.countries,
        dialOptions: state.dialOptions,
        countryOptions: state.countryOptions,
      }),
      version: 2,
      // storage: createJSONStorage(() => sessionStorage), // Uncomment to use sessionStorage
    }
  )
);
