import { useCountryStore } from "@/pages/HomePage/store/coutryStore";
import { fetchCountries } from "@/pages/HomePage/utils";
import { countryType } from "@/pages/HomePage/utils/homeInterfaces";
import { Field, useFormikContext } from "formik";
import React, { useEffect, useState } from "react";
import useStateRef from "react-usestateref";
import FormikInputDiv from "./FormikInput";

interface IProps {
  disabled: boolean;
  label: string;
  className?: string;
  placeholder?: string;
  zipCode?: string;
  zipClass?: string;
  required?: boolean;
}

const ContactInputComponent: React.FC<IProps> = ({
  disabled,
  label,
  className,
  zipCode,
  zipClass,
}) => {
  const countryStore = useCountryStore();
  const [countries, setCountries] = useState<countryType[]>([]);
  const [filteredCountries, setFilteredCountries] = useState<countryType[]>([]);
  const [searchTerm, setSearchTerm] = useState(zipCode || "+233");

  const { setFieldValue } = useFormikContext<object>();

  // Fetch countries on mount if not already in store
  useEffect(() => {
    if (!countryStore.countries.length) {
      fetchCountries().then((data) => {
        setCountries(data);
        countryStore.setCountries(data);
      });
    } else {
      setCountries(countryStore.countries);
    }
  }, [countryStore]);

  // Sync search term with zip code prop updates
  // useEffect(() => {
  //   if (!searchTerm) setSearchTerm(zipCode || "");
  // }, [zipCode, setSearchTerm]);

  // Handle country code input change
  const handleInputChange = (_: string, value: string) => {
    console.log(value, "value");
    const val = value.toString().toLowerCase();
    setSearchTerm(val);

    const filtered = countries.filter(
      (country) =>
        country.countryCode.toLowerCase().includes(val) ||
        country.initials.toLowerCase().includes(val) ||
        country.name.toLowerCase().includes(val) ||
        country.dialCode.toLowerCase().includes(val)
    );
    console.log("jjj", searchTerm);
    setFieldValue("country_code", filtered[0]?.dialCode || "");
    setFilteredCountries(filtered);
  };

  // Handle country selection
  const handleCountrySelect = (country: countryType) => {
    setSearchTerm(country.dialCode);
    setFieldValue("country_code", country.dialCode);
    setFilteredCountries([]);
  };

  return (
    <div>
      <p className="text-dark900 font-semibold">{label}</p>
      <div className="flex items-center w-full">
        {/* Country Code Input */}
        <div className="relative w-20">
          <Field
            component={FormikInputDiv}
            id="country_code"
            name="country_code"
            disabled={disabled}
            onChange={handleInputChange}
            inputClass={`w-full ${
              zipClass ||
              "rounded-l-lg p-2 border border-r-0 border-dark900 bg-lightGray/30"
            }`}
            placeholder="code"
            aria-describedby="country-code-description"
            aria-label="Country Calling Code"
            autocomplete="tel-country-code"
          />

          {/* Country Code Dropdown */}
          {searchTerm && filteredCountries.length > 0 && (
            <div className="absolute left-0 right-0 z-10 mt-1 bg-white rounded shadow w-full max-h-60 overflow-y-auto text-sm">
              {filteredCountries.map((country) => (
                <div
                  key={country.countryCode}
                  onClick={() => handleCountrySelect(country)}
                  className="p-1 cursor-pointer flex gap-1 items-center"
                >
                  <img
                    src={country.flag}
                    alt="country flag"
                    className="h-5 w-5"
                  />
                  {country.dialCode}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Phone Number Input (Takes Full Width) */}
        <div className="flex-grow">
          <Field
            component={FormikInputDiv}
            id={"primary_number"}
            name={"primary_number"}
            placeholder="enter phone number"
            disabled={disabled}
            inputClass={`w-full ${
              className || "rounded-r-lg p-2 border border-dark900"
            }`}
            type="tel"
          />
        </div>
      </div>
    </div>
  );
};

export const ContactInput = Object.assign(ContactInputComponent, {});
