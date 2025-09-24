import { Request, Response } from "express";
import { SalesReportService } from "./sales-report.service";

export class SalesReportController {
  private salesReportService: SalesReportService;
  constructor() {
    this.salesReportService = new SalesReportService();
  }
  forSuperAdmin = async (req: Request, res: Response) => {
    const { outletId, startDate, endDate, type } = req.query;
    const report = await this.salesReportService.forSuperAdmin({
      outletId: outletId as string,
      startDate: startDate as string,
      endDate: endDate as string,
    });
    res.status(200).json(report);
  };

  forOutletAdmin = async (req: Request, res: Response) => {
    const outletId = res.locals.payload.outletId;
    const { startDate, endDate} = req.query;

    const report = await this.salesReportService.forOutletAdmin({
      outletId,
      startDate: startDate as string,
      endDate: endDate as string,
    });

    res.status(200).json(report);
  };
}
