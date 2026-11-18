import assert from "node:assert/strict";
import { test } from "node:test";

import { getAddressAutocomplete } from "./address";

test("Nominatim supplies Russian address suggestions when Google is not configured", async () => {
  const originalFetch = globalThis.fetch;
  const originalKey = process.env.GOOGLE_PLACES_API_KEY;
  let requestedUrl = "";
  let requestedUserAgent = "";

  delete process.env.GOOGLE_PLACES_API_KEY;
  globalThis.fetch = async (input, init) => {
    requestedUrl = String(input);
    requestedUserAgent = new Headers(init?.headers).get("User-Agent") ?? "";
    return new Response(
      JSON.stringify([
        {
          place_id: 1,
          osm_type: "way",
          osm_id: 2,
          display_name: "Красная площадь, Москва, Россия",
          name: "Красная площадь",
          lat: "55.7539",
          lon: "37.6208",
        },
      ]),
    );
  };

  try {
    const result = await getAddressAutocomplete({ query: "Красная площадь" });
    const url = new URL(requestedUrl);
    assert.equal(url.hostname, "nominatim.openstreetmap.org");
    assert.equal(url.searchParams.get("countrycodes"), "ru");
    assert.equal(url.searchParams.get("accept-language"), "ru");
    assert.equal(url.searchParams.get("format"), "jsonv2");
    assert.equal(requestedUserAgent, "CatalogProkata/1.0");
    assert.equal(result.suggestions[0]?.placeId, "osm:W:2");
  } finally {
    globalThis.fetch = originalFetch;
    if (originalKey === undefined) delete process.env.GOOGLE_PLACES_API_KEY;
    else process.env.GOOGLE_PLACES_API_KEY = originalKey;
  }
});
