import { Request, Response } from "express";
import { LaundryServiceService } from "./laundry-service.service";

export class LaundryServiceController {
    private laundryServiceService: LaundryServiceService;
    constructor() {
        this.laundryServiceService = new LaundryServiceService();
    }

    getAllServices = async (req: Request, res: Response) => {
  try {
    const services = await this.laundryServiceService.getAllServices();
    res.status(200).json({ data: services });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Failed to fetch services" });
  }
};

}


