import InputDiv from "@/pages/HomePage/Components/reusable/InputDiv";
import React, { useEffect, useState } from "react";

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
  onChange: (name: string, value: string) => void;
}

const ContactInput: React.FC<ContactInputProps> = (props) => {
  const [countries, setCountries] = useState<Country[]>([]);
  const [filteredCountries, setFilteredCountries] = useState<Country[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCountry, setSelectedCountry] = useState<Country | null>(null);

  useEffect(() => {
    fetchCountries();
  }, []);

  const fetchCountries = async () => {
    try {
      const response = await fetch("https://restcountries.com/v3.1/all");
      if (!response.ok) {
        throw new Error("Network response was not ok " + response.statusText);
      }
      const data = await response.json();
      const filteredData: Country[] = data.map((country: any) => ({
        name: country.name?.common || "Unknown",
        countryCode: country.cca2 || "Unknown",
        dialCode:
          country.idd?.root + (country.idd?.suffixes?.[0] || "") || "Unknown",
        initials: country.altSpellings?.[0] || "Unknown",
        flag: country.flags?.png || "No flag available",
      }));
      setCountries(filteredData);
    } catch (error) {
      console.error("Failed to retrieve data", error);
    }
  };

  const handleInputChange = (name: string, val: string) => {
    const value = val.toLowerCase();
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
  };

  const handleCountrySelect = (country: Country) => {
    setSelectedCountry(country);
    props.onChange("code", country.dialCode);
    setSearchTerm(() => country.dialCode);
    setFilteredCountries([]);
  };

  return (
    <div className="flex gap-2 ">
      <div className="relative">
        <InputDiv
          label={"code"}
          placeholder={"code"}
          id={"country_code"}
          onChange={handleInputChange}
          value={searchTerm}
          className={" w-20 " + props.zipClass}
        />
        {searchTerm && (
          <div className="absolute left-0 right-0 mt-1 bg-white rounded shadow w-24 max-h-60 overflow-y-auto text-sma">
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
                {country.dialCode} ({country.initials})
              </div>
            ))}
          </div>
        )}
      </div>
      <InputDiv
        label={props.label}
        placeholder={props.placeholder}
        id={props.id}
        onChange={handleInputChange}
        value={searchTerm}
        className={" w-full " + props.className}
      />
    </div>
  );
};

export default ContactInput;
