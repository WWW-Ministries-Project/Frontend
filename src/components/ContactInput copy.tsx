import { useCountryStore } from "@/pages/HomePage/store/coutryStore";
import { countryType } from "@/pages/HomePage/utils/homeInterfaces";
import { Field, useFormikContext } from "formik";
import { useEffect, useState } from "react";
import { string } from "yup";
import { FormikInputDiv } from "./FormikInputDiv";

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
  label = "Phone Number",
  className,
  zipClass,
  prefix,
}: IProps) => {
  const { dialOptions } = useCountryStore();
  const [filteredCountries, setFilteredCountries] = useState<countryType[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const { setFieldValue } = useFormikContext<object>();

  // Sort countries alphabetically by name
  const sortedCountries = [...dialOptions].sort((a, b) =>
    a.name.localeCompare(b.name)
  );

  // Handle country code input change
  const handleInputChange = (_: string, value: string) => {
    const val = value.toString().toLowerCase();
    setSearchTerm(val);
    setIsDropdownOpen(true);

    const filtered = sortedCountries.filter(
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
    setIsDropdownOpen(false);
    setSearchTerm("");
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = () => setIsDropdownOpen(false);
    document.addEventListener("click", handleClickOutside);
    return () => document.removeEventListener("click", handleClickOutside);
  }, []);

  return (
    <div className="mb-4">
      <label className="text-primary font-semibold block mb-1">{label}</label>
      <div className="flex items-center w-full">
        {/* Country Code Input */}
        <div className="relative w-24">
          <Field
            component={FormikInputDiv}
            id={`${prefix}.phone.country_code`}
            name={`${prefix}.phone.country_code`}
            disabled={disabled}
            onChange={handleInputChange}
            onClick={(e: React.MouseEvent) => {
              e.stopPropagation();
              setIsDropdownOpen(true);
              if (!searchTerm) {
                setFilteredCountries(sortedCountries);
              }
            }}
            value={searchTerm}
            inputClass={`w-full ${
              zipClass ||
              "rounded-l-lg p-2 border border-r-0 border-primary bg-lightGray/30"
            }`}
            placeholder="Code"
            aria-describedby="country-code-description"
            aria-label="Country Calling Code"
            autoComplete="off"
          />

          {/* Country Code Dropdown */}
          {isDropdownOpen && filteredCountries.length > 0 && (
            <div
              className="absolute left-0 right-0 z-10 mt-1 bg-white rounded shadow-lg w-full max-h-60 overflow-y-auto text-sm border border-gray-200"
              onClick={(e) => e.stopPropagation()}
            >
              {filteredCountries.map((country) => (
                <div
                  key={country.countryCode}
                  onClick={() => handleCountrySelect(country)}
                  className="p-2 cursor-pointer hover:bg-gray-100 flex items-center gap-2"
                >
                  <img
                    src={country.flag}
                    alt={country.name}
                    className="h-4 w-6 object-cover"
                  />
                  <span className="font-medium">{country.dialCode}</span>
                  <span className="text-gray-600">{country.name}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Phone Number Input */}
        <div className="flex-grow relative">
          <Field
            component={FormikInputDiv}
            id={`${prefix}.phone.number`}
            name={`${prefix}.phone.number`}
            aria-label="Phone number"
            maxLength={10}
            placeholder="Enter phone number"
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
  country_code: string().required("Country code is required"),
};

export const ContactInput = Object.assign(ContactInputComponent, {
  initialValues,
  validationSchema,
});
