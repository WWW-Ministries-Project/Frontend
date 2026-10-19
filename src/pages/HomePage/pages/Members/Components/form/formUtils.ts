import { getIn, useFormikContext } from "formik";
import { useEffect, useMemo } from "react";

import type { SelectOption } from "@/pages/HomePage/pages/MembershipManagement/components/membershipUi";
import { useCountryStore } from "@/pages/HomePage/store/coutryStore";
import { fetchCountries } from "@/pages/HomePage/utils";

export interface ChoiceOption<T> {
  value: T;
  label: string;
}

export const TODAY = new Date().toISOString().split("T")[0];

/** Error is shown only once the field has been touched (matches Formik inputs). */
export const useFieldError = (name: string): string | undefined => {
  const { errors, touched } = useFormikContext<object>();
  const error = getIn(errors, name);
  return getIn(touched, name) && typeof error === "string" ? error : undefined;
};

export const YES_NO: ChoiceOption<boolean>[] = [
  { value: true, label: "Yes" },
  { value: false, label: "No" },
];

export const useCountries = () => {
  const { countryOptions, dialOptions } = useCountryStore();

  useEffect(() => {
    if (!countryOptions.length || !dialOptions.length) {
      fetchCountries().then((data) => {
        useCountryStore.getState().setCountries(data);
      });
    }
  }, [countryOptions.length, dialOptions.length]);

  const countries = useMemo<SelectOption[]>(
    () => countryOptions.map((option) => ({ value: String(option.value), label: option.label })),
    [countryOptions]
  );

  return { countries, dialOptions };
};
