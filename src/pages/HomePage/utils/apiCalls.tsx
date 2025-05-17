import { Currency, RestCountryAPIResponse } from "../utils/homeInterfaces";

// Define the expected shape of the response from restcountries API
// interface RestCountryAPIResponse {
//   name: { common: string };
//   cca2: CountryCode;
//   idd?: { root: string; suffixes: string[] };
//   altSpellings?: string[];
//   flags: { png: string };
// }

export const fetchCountries = async (): Promise<RestCountryAPIResponse[]> => {
  try {
    const response = await fetch(
      "https://restcountries.com/v3.1/all?fields=name,initials,cca2,idd,dialCode,flags"
    );
    if (!response.ok) {
      throw new Error("Network response was not ok " + response.statusText);
    }

    const data: RestCountryAPIResponse[] = await response.json();

    return data;
  } catch (error) {
    console.error("Failed to retrieve country data", error);
    return [];
  }
};

export async function fetchCurrencies(): Promise<{ data: Currency[] }> {
  try {
    const response = await fetch(
      "https://countriesnow.space/api/v0.1/countries/currency"
    );
    return await response?.json();
  } catch (error) {
    console.error("Failed to retrieve data", error);
    return { data: [] };
  }
}
