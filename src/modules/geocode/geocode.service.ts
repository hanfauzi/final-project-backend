import { AppError } from "../../utils/app.error";

export type ReverseGeoOut = { formatted: string; city: string };

export class GeocodeService {
  reverse = async (lat: number, lng: number): Promise<ReverseGeoOut> => {
    const key = process.env.OPENCAGE_KEY;
    if (!key) throw new AppError("OPENCAGE_KEY is not set", 500);

    const url = new URL("https://api.opencagedata.com/geocode/v1/json");
    url.searchParams.set("q", `${lat},${lng}`);
    url.searchParams.set("key", key);
    url.searchParams.set("no_annotations", "1");
    url.searchParams.set("language", "id");

    const res = await fetch(url.toString(), { cache: "no-store" });
    if (!res.ok) {
      throw new AppError(`Geocode provider error (${res.status})`, 502);
    }

    const data: any = await res.json();
    const first = data?.results?.[0];
    const comps = first?.components ?? {};

    const city =
      comps.city ||
      comps.town ||
      comps.village ||
      comps.municipality ||
      comps.suburb ||
      comps.county ||
      comps.state ||
      comps.country ||
      "";

    const primaryRoad =
      comps.road ||
      comps.pedestrian ||
      comps.cycleway ||
      comps.footway ||
      comps.path ||
      comps.neighbourhood ||
      comps.suburb ||
      "";

    let addressLine = first?.formatted ?? "";

    if (primaryRoad && /^unnamed/i.test(primaryRoad)) {
      addressLine =
        [comps.neighbourhood, comps.suburb, comps.city || comps.town || comps.village]
          .filter(Boolean)
          .join(", ") || addressLine;
    } else if (primaryRoad) {
      addressLine = [primaryRoad, comps.house_number, comps.postcode]
        .filter(Boolean)
        .join(" ");
    }

    return {
      formatted: addressLine || `${lat.toFixed(5)}, ${lng.toFixed(5)}`,
      city,
    };
  };
}
