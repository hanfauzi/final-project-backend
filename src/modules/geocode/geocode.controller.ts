import { Request, Response } from "express";
import { GeocodeService } from "./geocode.service";
import { AppError } from "../../utils/app.error";

export class GeocodeController {
  private geocodeService: GeocodeService;

  constructor() {
    this.geocodeService = new GeocodeService();
  }

  reverse = async (req: Request, res: Response) => {
    const latStr = String(req.query.lat ?? "");
    const lngStr = String(req.query.lng ?? "");
    const lat = Number(latStr);
    const lng = Number(lngStr);

    if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
      throw new AppError("Query params 'lat' & 'lng' must be numbers", 400);
    }

    const out = await this.geocodeService.reverse(lat, lng);
    res.status(200).json(out);
  };
}
