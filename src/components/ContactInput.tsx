import { InputDiv } from "@/pages/HomePage/Components/reusable/InputDiv";
import { useCountryStore } from "@/pages/HomePage/store/coutryStore";
import { fetchCountries } from "@/pages/HomePage/utils";
import { countryType } from "@/pages/HomePage/utils/homeInterfaces";
import { Field, getIn, useFormikContext } from "formik";
import { parsePhoneNumberFromString } from "libphonenumber-js";
import { useEffect, useMemo, useState } from "react";
import { string } from "yup";
import { FormikInputDiv } from "./FormikInputDiv";

interface IProps {
  disabled?: boolean;
  label?: string;
  className?: string;
  placeholder?: string;
  zipClass?: string;
  required?: boolean;
  prefix?: string;
}

const ContactInputComponent = ({
  disabled = false,
  label = "Phone Number",
  className,
  zipClass,
  prefix,
}: IProps) => {
  const { dialOptions } = useCountryStore();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  const { setFieldValue, values, errors, setFieldError } =
    useFormikContext<object>();
  const code = useMemo(() => {
    return getIn(values, `${prefix ? `${prefix}.phone.country_code` : "phone.country_code"}`) ?? "+233";
  }, [values, prefix]);
  const phone = useMemo(() => {
    return getIn(values, `${prefix ? `${prefix}.phone.number` : "phone.number"}`);
  }, [values, prefix]);
  const error = getIn(errors, `${prefix ? `${prefix}.phone.number` : "phone.number"}`);
  const countryCode = useMemo(() => {
    return dialOptions.find((c) => c.dialCode === code)?.countryCode || "GH";
  }, [code, dialOptions]);

  // Handle country code input change
  // const handleInputChange = (value: string | number) => {
  //   setFieldValue(`${prefix}.phone.number`, value);
  //   return validatePhoneNumber(value.toString());
  // };

  // Handle country selection
  const handleCountrySelect = (country: countryType) => {
    setFieldValue(`${prefix ? `${prefix}.phone.country_code` : "phone.country_code"}`, country.dialCode);
    // setCountryCode(country.countryCode);
    validatePhoneNumber(phone);
    setIsDropdownOpen(false);
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = () => setIsDropdownOpen(false);
    document.addEventListener("click", handleClickOutside);
    return () => document.removeEventListener("click", handleClickOutside);
  }, []);

  useEffect(() => {
    if (!dialOptions.length) {
      fetchCountries().then((data) => {
        useCountryStore.setState({ countries: data });
      });
    }
  }, [dialOptions]);

  function validatePhoneNumber(input: string): boolean {
    if (!input) return false;
    const phoneNumber = parsePhoneNumberFromString(input, countryCode);
    // setFieldValue(`${prefix}.phone.number`,input);
    setFieldError(
      `${prefix ? `${prefix}.phone.number` : "phone.number"}`,
      phoneNumber?.isValid()
        ? undefined
        : "Invalid phone number for selected country"
    );
    return phoneNumber?.isValid() ?? false;
  }

  return (
    <div className="mb-4">
      <label className="text-primary font-semibold block ">{label}</label>
      <div className="flex items-center w-full relative ">
        {/* Country Code Input */}
        <div className="w-20">
          <InputDiv
            id={`${prefix ? `${prefix}.phone.country_code` : "phone.country_code"}`}
            value={code}
            disabled={disabled}
            onChange={() => {
              validatePhoneNumber(phone);
            }}
            // onChange={() => null}
            onClick={(e: React.MouseEvent) => {
              e.stopPropagation();
              setIsDropdownOpen(true);
            }}
            inputClass={`w-full  ${
              zipClass ||
              "rounded-l-lg p-2 border border-r-0 border-primary bg-lightGray/20"
            }  ${error ? "border-error" : "border-primary"}`}
            placeholder="Code"
            aria-describedby="country-code-description"
            aria-label="Country Calling Code"
          />

          {/* Country Code Dropdown */}
          {isDropdownOpen && dialOptions.length > 0 && (
            <div
              className="absolute left-0 right-0 z-10 mt-1 bg-white rounded shadow-lg max-h-60 overflow-y-auto text-sm border border-gray-200"
              onClick={(e) => e.stopPropagation()}
            >
              {dialOptions.map((country) => (
                <div
                  key={country.countryCode + country.dialCode}
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
        <div className="flex-grow">
          <Field
            component={FormikInputDiv}
            name={`${prefix ? `${prefix}.phone.number` : "phone.number"}`}
            id={`${prefix ? `${prefix}.phone.number` : "phone.number"}`}
            aria-label="Phone number"
            placeholder="Enter phone number"
            supressErrorDisplay={true}
            value={phone}
            validate={(value: string) => {
              if (!value) return "";
              const phoneNumber = parsePhoneNumberFromString(
                value,
                countryCode
              );
              return phoneNumber?.isValid()
                ? undefined
                : "Invalid phone number for selected country";
            }}
            disabled={disabled}
            inputClass={`w-full ${className || "rounded-r-lg p-2 border"} ${
              error ? "border-error" : "border-primary"
            }`}
            type="tel"
          />
        </div>
      </div>
      {error && <p className="text-error text-sma">{error}</p>}
    </div>
  );
};

export interface IContactInput {
  country_code: string;
  number: string;
}

const initialValues: IContactInput = {
  country_code: "+233",
  number: "",
};

const validationSchema = {
  number: string().required("Phone number is required"),
  country_code: string().required("Country code is required"),
};

export const ContactInput = Object.assign(ContactInputComponent, {
  initialValues,
  validationSchema,
});
