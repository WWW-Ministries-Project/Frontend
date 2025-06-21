import { useCountryStore } from "@/pages/HomePage/store/coutryStore";
import { fetchCountries } from "@/pages/HomePage/utils";
import { Field } from "formik";
import { useEffect } from "react";
import FormikSelectField from "../FormikSelect";

export const CountryField = ({
  disabled = false,
  prefix,
  name,
  label,
  placeholder,
}: {
  disabled?: boolean;
  prefix?: string;
  name?: string;
  label?: string;
  placeholder?: string;
}) => {
  const countryStore = useCountryStore();
  const { countryOptions } = useCountryStore();

  // Fetch countries on mount if not already in store
  useEffect(() => {
    if (!countryOptions.length) {
      fetchCountries().then((data) => {
        countryStore.setCountries(data);
      });
    }
  }, [countryOptions, countryStore]);

  return (
    <Field
      component={FormikSelectField}
      label={label || "Nationality *"}
      placeholder={placeholder || "Select nationality"}
      id={name || `${prefix}.nationality`}
      name={name || `${prefix}.nationality`}
      options={countryOptions || []}
      disabled={disabled}
    />
  );
};
