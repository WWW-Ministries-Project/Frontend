import InputDiv from "@/pages/HomePage/Components/reusable/InputDiv";
import { useCountryStore } from "@/pages/HomePage/store/coutryStore";
import { fetchCountries } from "@/pages/HomePage/utils/apiCalls";
import { countryType } from "@/pages/HomePage/utils/homeInterfaces";
import useState from "react-usestateref";
import React, { useEffect } from "react";

interface Country {
  name: string;
  countryCode: string;
  dialCode: string;
  initials: string;
  flag: string;
}

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

const ContactInput: React.FC<ContactInputProps> = (props) => {
  const [countries, setCountries] = useState<countryType[]>([]);
  const [filteredCountries, setFilteredCountries] = useState<countryType[]>([]);
  const [searchTerm, setSearchTerm,searchTermRef] = useState(props.zipCode || "");
  const [selectedCountry, setSelectedCountry] = useState<Country | null>(null);
  const [error, setErrors] = useState<{ [key: string]: string }>({
    code: "",
    phone: "",
  });
  const countryStore = useCountryStore();

  useEffect(() => {
    if (!countryStore.countries.length) {
      fetchCountries().then((data) => {
        setCountries(data);
        countryStore.setCountries(data);
      });
    }else{
      setCountries(countryStore.countries)
    }
  }, []);

  const handleInputChange = (name: string, val: string | number) => {
    const value = val.toString().toLowerCase();
    setSearchTerm(value);
    const filtered = countries.filter(
      (country) =>
        country.countryCode.toLowerCase().includes(value) ||
        country.initials.toLowerCase().includes(value) ||
        country.name.toLowerCase().includes(value) ||
        country.dialCode.toLowerCase().includes(value)
    );
    props.onChange(name, filtered[0]?.dialCode || "");
    setFilteredCountries(filtered);
    handleBlur(name);
  };

  const handleCountrySelect = (country: Country) => {
    setSelectedCountry(country);
    props.onChange("country_code", country.dialCode);
    setSearchTerm(() => country.dialCode);
    setFilteredCountries([]);
    handleBlur("country_code");
  };

  const handleBlur = (name: string) => {
    if (name == "country_code") {
      if (!searchTermRef.current.match(/^\+\d+$/)) {
        setErrors((prev) => ({ ...prev, [name]: "Invalid" }));
      } else setErrors((prev) => ({ ...prev, [name]: "" }));
    }
    if (name == "phone") {
      if (!props.contactValue?.match(/^[\d\s\-()]+$/)) {
        setErrors((prev) => ({
          ...prev,
          [name]: "Please enter a valid phone number",
        }));
      } else setErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };
  return (
    <div className="flex gap-2 ">
      <div className="relative">
        <InputDiv
          label={"code"}
          placeholder={"code"}
          id={"country_code"}
          error={error.country_code}
          onBlur={() => {
            handleBlur("country_code");
          }}
          disabled={props.disabled}
          onChange={handleInputChange}
          value={searchTerm}
          className={" w-16 " + props.zipClass}
          aria-describedby="country-code-description" aria-label="Country Calling Code"
          autocomplete="tel-country-code"
        />
        {searchTerm && (
          <div className="absolute left-0 right-0 z-10 mt-1 bg-white rounded shadow w-20 max-h-60 overflow-y-auto text-sma codes">
            {filteredCountries.map((country) => (
              <div
                key={country.countryCode}
                onClick={() => handleCountrySelect(country)}
                className="p-1 hover: cursor-pointer flex gap-1 items-center"
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
      <InputDiv
        label={props.label}
        placeholder={props.placeholder}
        id={props.id}
        onChange={props.onChange}
        onBlur={() => {
          handleBlur("phone");
        }}
        value={props.contactValue}
        error={error.phone}
        disabled={props.disabled}
        className={" w-full " + props.className}
      />
    </div>
  );
};

export default ContactInput;
