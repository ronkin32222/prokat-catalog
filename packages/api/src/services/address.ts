import type { AddressDetails, AddressSuggestion } from "@louez/types";
import { ApiServiceError } from "./errors";

interface GetAddressAutocompleteParams {
  query: string;
  googlePlacesApiKey?: string;
}

interface GetAddressDetailsParams {
  placeId: string;
  googlePlacesApiKey?: string;
}

interface ResolveAddressQueryParams {
  query: string;
  googlePlacesApiKey?: string;
}

interface ReverseGeocodeParams {
  latitude: number;
  longitude: number;
}

const NOMINATIM_URL = "https://nominatim.openstreetmap.org";
const NOMINATIM_HEADERS = { "User-Agent": "CatalogProkata/1.0" };
// shortcut: rate limiting is per server process, use a shared limiter when running multiple replicas.
let nominatimQueue = Promise.resolve();
let lastNominatimRequestAt = 0;

const getGoogleApiKey = (apiKey?: string): string | undefined =>
  apiKey ?? process.env.GOOGLE_PLACES_API_KEY;

const fetchNominatim = (url: URL): Promise<Response> => {
  const request = nominatimQueue.then(async () => {
    const waitMs = Math.max(0, 1000 - (Date.now() - lastNominatimRequestAt));
    if (waitMs > 0) await new Promise((resolve) => setTimeout(resolve, waitMs));
    lastNominatimRequestAt = Date.now();
    return fetch(url, { headers: NOMINATIM_HEADERS });
  });
  nominatimQueue = request.then(
    () => undefined,
    () => undefined,
  );
  return request;
};

interface NominatimPlace {
  place_id: number;
  osm_type?: string;
  osm_id?: number;
  display_name: string;
  lat: string;
  lon: string;
  name?: string;
  address?: Record<string, string>;
}

const nominatimDetails = (place: NominatimPlace): AddressDetails => {
  const address = place.address ?? {};
  return {
    placeId: `osm:${place.osm_type?.slice(0, 1).toUpperCase() ?? "N"}:${place.osm_id ?? place.place_id}`,
    formattedAddress: place.display_name,
    latitude: Number(place.lat),
    longitude: Number(place.lon),
    streetNumber: address.house_number,
    street: address.road,
    city: address.city || address.town || address.village || address.municipality,
    postalCode: address.postcode,
    country: address.country,
    countryCode: address.country_code?.toUpperCase(),
  };
};

const searchNominatim = async (query: string, limit: number): Promise<NominatimPlace[]> => {
  const url = new URL("/search", NOMINATIM_URL);
  url.search = new URLSearchParams({
    q: query,
    countrycodes: "ru",
    "accept-language": "ru",
    format: "jsonv2",
    addressdetails: "1",
    limit: String(limit),
  }).toString();
  const response = await fetchNominatim(url);
  if (!response.ok)
    throw new ApiServiceError("INTERNAL_SERVER_ERROR", "errors.addressLookupFailed");
  return response.json() as Promise<NominatimPlace[]>;
};

export async function getAddressAutocomplete(
  params: GetAddressAutocompleteParams,
): Promise<{ suggestions: AddressSuggestion[] }> {
  const { query, googlePlacesApiKey } = params;
  const apiKey = getGoogleApiKey(googlePlacesApiKey);

  if (!apiKey) {
    const places = await searchNominatim(query, 5);
    return {
      suggestions: places.map((place) => ({
        placeId: nominatimDetails(place).placeId,
        description: place.display_name,
        mainText: place.name || place.display_name.split(",")[0] || place.display_name,
        secondaryText: place.display_name.split(",").slice(1).join(",").trim(),
      })),
    };
  }

  const response = await fetch("https://places.googleapis.com/v1/places:autocomplete", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Goog-Api-Key": apiKey,
    },
    body: JSON.stringify({
      input: query,
      includedPrimaryTypes: ["street_address", "premise", "route", "locality", "postal_code"],
    }),
  });

  const data = await response.json();

  if (!response.ok || data.error) {
    throw new ApiServiceError("INTERNAL_SERVER_ERROR", "errors.addressLookupFailed", data.error);
  }

  const suggestions: AddressSuggestion[] = (data.suggestions || [])
    .slice(0, 5)
    .filter((item: { placePrediction?: unknown }) => item.placePrediction)
    .map(
      (item: {
        placePrediction: {
          placeId: string;
          text: { text: string };
          structuredFormat: {
            mainText: { text: string };
            secondaryText: { text?: string };
          };
        };
      }) => ({
        placeId: item.placePrediction.placeId,
        description: item.placePrediction.text.text,
        mainText: item.placePrediction.structuredFormat.mainText.text,
        secondaryText: item.placePrediction.structuredFormat.secondaryText?.text || "",
      }),
    );

  return { suggestions };
}

export async function resolveAddressQuery(
  params: ResolveAddressQueryParams,
): Promise<{ details: AddressDetails | null }> {
  const { query, googlePlacesApiKey } = params;
  const apiKey = getGoogleApiKey(googlePlacesApiKey);

  if (!apiKey) {
    const [place] = await searchNominatim(query, 1);
    return { details: place ? nominatimDetails(place) : null };
  }

  const response = await fetch("https://places.googleapis.com/v1/places:searchText", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Goog-Api-Key": apiKey,
      "X-Goog-FieldMask":
        "places.id,places.formattedAddress,places.location,places.addressComponents",
    },
    body: JSON.stringify({
      textQuery: query,
      maxResultCount: 1,
    }),
  });

  const data = await response.json();

  if (!response.ok || data.error) {
    throw new ApiServiceError("INTERNAL_SERVER_ERROR", "errors.addressLookupFailed", data.error);
  }

  const place = data.places?.[0];
  if (!place) {
    return { details: null };
  }

  const addressComponents = place.addressComponents || [];

  const getComponent = (types: string[]): string | undefined => {
    const component = addressComponents.find((entry: { types: string[] }) =>
      types.some((type) => entry.types.includes(type)),
    );
    return component?.longText;
  };

  const getComponentShort = (types: string[]): string | undefined => {
    const component = addressComponents.find((entry: { types: string[] }) =>
      types.some((type) => entry.types.includes(type)),
    );
    return component?.shortText;
  };

  return {
    details: {
      placeId: place.id,
      formattedAddress: place.formattedAddress,
      latitude: place.location?.latitude,
      longitude: place.location?.longitude,
      streetNumber: getComponent(["street_number"]),
      street: getComponent(["route"]),
      city: getComponent(["locality", "administrative_area_level_2"]),
      postalCode: getComponent(["postal_code"]),
      country: getComponent(["country"]),
      countryCode: getComponentShort(["country"]),
    },
  };
}

export async function getAddressDetails(
  params: GetAddressDetailsParams,
): Promise<{ details: AddressDetails }> {
  const { placeId, googlePlacesApiKey } = params;
  const apiKey = getGoogleApiKey(googlePlacesApiKey);

  if (placeId.startsWith("osm:")) {
    const match = /^osm:([NWR]):(\d+)$/.exec(placeId);
    if (!match) throw new ApiServiceError("BAD_REQUEST", "errors.invalidData");
    const url = new URL("/lookup", NOMINATIM_URL);
    url.search = new URLSearchParams({
      osm_ids: `${match[1]}${match[2]}`,
      "accept-language": "ru",
      format: "jsonv2",
      addressdetails: "1",
    }).toString();
    const response = await fetchNominatim(url);
    const places = response.ok ? ((await response.json()) as NominatimPlace[]) : [];
    const place = places[0];
    if (!place) throw new ApiServiceError("INTERNAL_SERVER_ERROR", "errors.addressLookupFailed");
    return { details: nominatimDetails(place) };
  }

  if (!apiKey) {
    throw new ApiServiceError("INTERNAL_SERVER_ERROR", "errors.addressLookupFailed");
  }

  const response = await fetch(`https://places.googleapis.com/v1/places/${placeId}`, {
    method: "GET",
    headers: {
      "X-Goog-Api-Key": apiKey,
      "X-Goog-FieldMask": "id,formattedAddress,location,addressComponents",
    },
  });

  const data = await response.json();

  if (!response.ok || data.error) {
    throw new ApiServiceError("INTERNAL_SERVER_ERROR", "errors.addressLookupFailed", data.error);
  }

  const addressComponents = data.addressComponents || [];

  const getComponent = (types: string[]): string | undefined => {
    const component = addressComponents.find((entry: { types: string[] }) =>
      types.some((type) => entry.types.includes(type)),
    );
    return component?.longText;
  };

  const getComponentShort = (types: string[]): string | undefined => {
    const component = addressComponents.find((entry: { types: string[] }) =>
      types.some((type) => entry.types.includes(type)),
    );
    return component?.shortText;
  };

  return {
    details: {
      placeId: data.id,
      formattedAddress: data.formattedAddress,
      latitude: data.location?.latitude,
      longitude: data.location?.longitude,
      streetNumber: getComponent(["street_number"]),
      street: getComponent(["route"]),
      city: getComponent(["locality", "administrative_area_level_2"]),
      postalCode: getComponent(["postal_code"]),
      country: getComponent(["country"]),
      countryCode: getComponentShort(["country"]),
    },
  };
}

export async function reverseGeocode(
  params: ReverseGeocodeParams,
): Promise<{ details: AddressDetails | null }> {
  const { latitude, longitude } = params;

  try {
    // Use OpenStreetMap Nominatim for reverse geocoding (free, no API key needed)
    const response = await fetchNominatim(
      new URL(
        `/reverse?lat=${latitude}&lon=${longitude}&format=jsonv2&addressdetails=1&countrycodes=ru&accept-language=ru`,
        NOMINATIM_URL,
      ),
    );

    const data = await response.json();

    if (data.error || !data.display_name) {
      return { details: null };
    }

    const addr = data.address || {};

    return {
      details: {
        placeId: String(data.place_id || ""),
        formattedAddress: data.display_name,
        latitude,
        longitude,
        streetNumber: addr.house_number,
        street: addr.road,
        city: addr.city || addr.town || addr.village || addr.municipality,
        postalCode: addr.postcode,
        country: addr.country,
        countryCode: addr.country_code?.toUpperCase(),
      },
    };
  } catch {
    return { details: null };
  }
}
