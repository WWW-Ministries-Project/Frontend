import { countryType } from "../utils/homeInterfaces";

export const fetchCountries = async () => {
    try {
      const response = await fetch("https://restcountries.com/v3.1/all");
      if (!response.ok) {
        throw new Error("Network response was not ok " + response.statusText);
      }
      const data = await response.json();
      const filteredData: countryType[] = data.map((country: any) => ({
        name: country.name?.common || "Unknown",
        countryCode: country.cca2 || "Unknown",
        dialCode:
          country.idd?.root + (country.idd?.suffixes?.[0] || "") || "Unknown",
        initials: country.altSpellings?.[0] || "Unknown",
        flag: country.flags?.png || "No flag available",
      }));
      return(filteredData);
    } catch (error) {
      console.error("Failed to retrieve data", error);
      return([]);
    }
  };