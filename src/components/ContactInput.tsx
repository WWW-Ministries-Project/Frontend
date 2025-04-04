import { useCountryStore } from "@/pages/HomePage/store/coutryStore";
import { countryType } from "@/pages/HomePage/utils/homeInterfaces";
import { Field, useFormikContext } from "formik";
import { useState } from "react";
import { string } from "yup";
import FormikInputDiv from "./FormikInput";

interface IProps {
  disabled?: boolean;
  label?: string;
  className?: string;
  placeholder?: string;
  zipClass?: string;
  required?: boolean;
  prefix: string;
}

const ContactInputComponent = ({
  disabled = false,
  label="Phone Number",
  className,
  zipClass,
  prefix,
}: IProps) => {
  const { countries } = useCountryStore();
  const [filteredCountries, setFilteredCountries] = useState<countryType[]>([]);
  const [searchTerm, setSearchTerm] = useState("");

  const { setFieldValue } = useFormikContext<object>();

  // Sync search term with zip code prop updates
  // useEffect(() => {
  //   if (!searchTerm) setSearchTerm(zipCode || "");
  // }, [zipCode, setSearchTerm]);

  // Handle country code input change
  const handleInputChange = (_: string, value: string) => {
    const val = value.toString().toLowerCase();
    setSearchTerm(val);

    const filtered = countries.filter(
      (country) =>
        country.countryCode.toLowerCase().includes(val) ||
        country.initials.toLowerCase().includes(val) ||
        country.name.toLowerCase().includes(val) ||
        country.dialCode.toLowerCase().includes(val)
    );
    setFilteredCountries(filtered);
  };

  // Handle country selection
  const handleCountrySelect = (country: countryType) => {
    setFieldValue(`${prefix}.phone.country_code`, country.dialCode);
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
            id={`${prefix}.phone.country_code`}
            name={`${prefix}.phone.country_code`}
            disabled={disabled}
            onChange={handleInputChange}
            inputClass={`w-full ${
              zipClass ||
              "rounded-l-lg p-2 border border-r-0 border-primary bg-lightGray/30"
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
            id={`${prefix}.phone.number`}
            name={`${prefix}.phone.number`}
            aria-label="phone number"
            maxlength={10}
            placeholder="enter phone number"
            disabled={disabled}
            inputClass={`w-full ${
              className || "rounded-r-lg p-2 border border-primary"
            }`}
            type="tel"
          />
        </div>
      </div>
    </div>
  );
};
export interface IContactInput {
  country_code: string;
  number: string;
}
const initialValues: IContactInput = {
  country_code: "",
  number: "",
};

const validationSchema = {
  number: string()
    .matches(/^[0-9]{10}$/, "Phone number must be 10 digits")
    .required("Phone number is required"),
  country_code: string().required("required"),
};

export const ContactInput = Object.assign(ContactInputComponent, {
  initialValues,
  validationSchema,
});
