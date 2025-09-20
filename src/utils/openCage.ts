import axios from "axios";

export const getCoordinatesFromAddress = async (address: string) => {
  const apiKey = process.env.OPENCAGE_API_KEY;
  const url = `https://api.opencagedata.com/geocode/v1/json?q=${encodeURIComponent(address)}&key=${apiKey}`;

  const res = await axios.get(url);

  if (res.data.results.length > 0) {
    const { lat, lng } = res.data.results[0].geometry;
    return { latitude: lat, longitude: lng };
  } else {
    throw new Error("Coordinates not found for this address");
  }
};
