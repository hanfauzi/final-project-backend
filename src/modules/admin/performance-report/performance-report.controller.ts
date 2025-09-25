// performance-report.controller.ts
import { Request, Response } from "express";
import { PerformanceReportService } from "./performance-report.service";
import { plainToInstance } from "class-transformer";
import { validate } from "class-validator";
import { GetPerformanceDto } from "./dto/get-perfomance.dto";

export class PerformanceReportController {
  private service: PerformanceReportService;

  constructor() {
    this.service = new PerformanceReportService();
  }

  getPerformanceForSuperAdmin = async (req: Request, res: Response) => {
    try {
      const { startDate, endDate, outletId } = req.query;

      const result = await this.service.getPerformanceInfo({
        startDate: startDate as string,
        endDate: endDate as string,
        outletId: outletId ? (outletId as string) : undefined,
      });

      res.status(200).json(result);
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: "Internal server error" });
    }
  };

  getPerformanceForOutletAdmin = async (req: Request, res: Response) => {
    const outletId = res.locals.payload.outletId;
    const { startDate, endDate } = req.query;
    const result = await this.service.getPerformanceInfo({
      startDate: startDate as string,
      endDate: endDate as string,
      outletId,
    });
    res.status(200).json(result);
  };
}
