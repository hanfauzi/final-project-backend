import { Request, Response } from "express";
import { CityService } from "./city.service";

export class CityController {
  private cityService: CityService;
  constructor() {
    this.cityService = new CityService();
  }

  getCities = async (req: Request, res: Response) => {
    const cities = await this.cityService.getCities();
    res.status(200).json({
      success: true,
      data: cities,
    });
  };
}
