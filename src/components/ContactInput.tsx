import React, { useEffect, useState } from "react";
import useStateRef from "react-usestateref";
import InputDiv from "@/pages/HomePage/Components/reusable/InputDiv";
import { useCountryStore } from "@/pages/HomePage/store/coutryStore";
import { fetchCountries } from "@/pages/HomePage/utils";
import { countryType } from "@/pages/HomePage/utils/homeInterfaces";

interface ContactInputProps {
  id: string;
  disabled: boolean;
  label: string;
  className?: string;
  placeholder?: string;
  contactValue?: string;
  zipCode?: string;
  zipClass?: string;
  required?: boolean;
  onChange: (name: string, value: string | number | boolean) => void;
}

const ContactInput: React.FC<ContactInputProps> = ({
  id,
  disabled,
  label,
  className,
  placeholder,
  contactValue,
  zipCode,
  zipClass,
  onChange,
}) => {
  const countryStore = useCountryStore();
  const [countries, setCountries] = useState<countryType[]>([]);
  const [filteredCountries, setFilteredCountries] = useState<countryType[]>([]);
  const [searchTerm, setSearchTerm, searchTermRef] = useStateRef(zipCode || "+233");
  const [error, setError] = useState<{ country_code?: string; phone?: string }>({
    country_code: "",
    phone: "",
  });

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
  useEffect(() => {
    if (!searchTerm) setSearchTerm(zipCode || "");
  }, [zipCode, setSearchTerm]);

  // Handle country code input change
  const handleInputChange = (name: string, value: string | number) => {
    const val = value.toString().toLowerCase();
    setSearchTerm(val);

    const filtered = countries.filter(
      (country) =>
        country.countryCode.toLowerCase().includes(val) ||
        country.initials.toLowerCase().includes(val) ||
        country.name.toLowerCase().includes(val) ||
        country.dialCode.toLowerCase().includes(val)
    );

    onChange(name, filtered[0]?.dialCode || "");
    setFilteredCountries(filtered);
    handleBlur(name);
  };

  // Handle country selection
  const handleCountrySelect = (country: countryType) => {
    setSearchTerm(country.dialCode);
    onChange("country_code", country.dialCode);
    setFilteredCountries([]);
    handleBlur("country_code");
  };

  // Handle input validation
  const handleBlur = (name: string) => {
    if (name === "country_code" && !searchTermRef.current.match(/^\+\d+$/)) {
      setError((prev) => ({ ...prev, [name]: "Invalid country code" }));
    } else {
      setError((prev) => ({ ...prev, [name]: "" }));
    }

    if (name === "phone" && contactValue && !contactValue.match(/^[\d\s\-()]+$/)) {
      setError((prev) => ({
        ...prev,
        [name]: "Please enter a valid phone number",
      }));
    } else {
      setError((prev) => ({ ...prev, [name]: "" }));
    }
  };

  return (
    <div>
      <p className="text-dark900 font-semibold">{label}</p>
      <div className="flex items-center w-full">
      
      {/* Country Code Input */}
      <div className="relative w-20">
        <InputDiv
          label=""
          placeholder="Code"
          id="country_code"
          error={error.country_code}
          onBlur={() => handleBlur("country_code")}
          disabled={disabled}
          onChange={handleInputChange}
          value={searchTerm}
          inputClass={`w-full ${zipClass || "rounded-l-lg p-2 border border-r-0 border-dark900 bg-lightGray/30"}`}
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
                <img src={country.flag} alt="country flag" className="h-5 w-5" />
                {country.dialCode}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Phone Number Input (Takes Full Width) */}
      <div className="flex-grow">
        <InputDiv
          label={''}
          placeholder={placeholder}
          id={id}
          onChange={onChange}
          onBlur={() => handleBlur("phone")}
          value={contactValue}
          error={error.phone}
          disabled={disabled}
          inputClass={`w-full ${className || "rounded-r-lg p-2 border border-dark900"}`}
        />
      </div>
    </div>
    </div>
  );
};

export default ContactInput;
