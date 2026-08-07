import { getCountries, getCountryCallingCode } from "libphonenumber-js";
import { Currency, RestCountryAPIResponse } from "../utils/homeInterfaces";

// Country data used to be fetched from restcountries.com's v3.1 API, but
// that API has been shut down (see
// https://restcountries.com/docs/countries/legacy-api-deprecation) - it now
// requires a signed-up API key and returns a different response shape, so
// the old `fetch()` silently produced an empty/broken list and the country
// select on checkout never had any options to render.
//
// Instead, generate the list locally: `libphonenumber-js` (already a
// dependency, used elsewhere for phone validation) ships the ISO country
// list and calling codes, and `Intl.DisplayNames` (native to the browser)
// supplies the human-readable name. This removes the runtime dependency on
// a third-party service entirely.
const regionNames =
  typeof Intl !== "undefined" && "DisplayNames" in Intl
    ? new Intl.DisplayNames(["en"], { type: "region" })
    : null;

const getCountryName = (cca2: string): string => {
  try {
    return regionNames?.of(cca2) ?? cca2;
  } catch {
    return cca2;
  }
};

// Builds the Unicode "regional indicator" flag emoji from the two-letter
// ISO code (e.g. "GH" -> 🇬🇭), so no flag image asset/service is needed.
const getFlagEmoji = (cca2: string): string =>
  cca2
    .toUpperCase()
    .replace(/./g, (char) => String.fromCodePoint(127397 + char.charCodeAt(0)));

export const fetchCountries = async (): Promise<RestCountryAPIResponse[]> => {
  return getCountries().map((cca2) => ({
    name: { common: getCountryName(cca2) },
    cca2,
    idd: { root: `+${getCountryCallingCode(cca2)}`, suffixes: [""] },
    altSpellings: [cca2],
    flags: { emoji: getFlagEmoji(cca2) },
  }));
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
