import { NextFunction, Request, Response } from "express";
import { OutletService } from "./outlet.service";

export class OutletController {
  private outletService: OutletService;
  constructor() {
    this.outletService = new OutletService();
  }

  getAllOutlets = async (_: Request, res: Response, next: NextFunction) => {
    const outlets = await this.outletService.getAllOutlets();
    res
      .status(200)
      .json({ message: "Get all outlets data successfully", data: outlets });
  };

  getOutletDetailById = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const outlet = await this.outletService.getOutletDetailById(id);
      res
        .status(200)
        .json({ message: "Get outlet detail successfully", data: outlet });
    } catch (error) {
      next(error);
    }
  }

  createOutlet = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const outlet = await this.outletService.createOutlet(req.body);
      res
        .status(201)
        .json({ message: "Outlet created successfully", data: outlet });
    } catch (error) {
      next(error);
    }
  };

  updateOutlet = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const data = req.body;
      const outlet = await this.outletService.updateOutlet(id, data);
      res
        .status(200)
        .json({ message: "Outlet updated successfully", data: outlet });
    } catch (error) {
      next(error);
    }
  };

  deleteOutlet = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      await this.outletService.deleteOutlet(id);
      res.status(200).json({ message: "Outlet deleted successfully" });
    } catch (error) {
      next(error);
    }
  }
}
