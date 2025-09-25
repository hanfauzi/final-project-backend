import { Router } from "express";
import { JwtVerify } from "../../../middlewares/jwt-verify.middleware";
import { PerformanceReportController } from "./performance-report.controller";

export class PerformanceReportRouter {
  private performanceReportController: PerformanceReportController;
  private router: Router;

  constructor() {
    this.performanceReportController = new PerformanceReportController();
    this.router = Router();
    this.initializeRoutes();
  }

  private initializeRoutes(): void {
    this.router.get(
      "/",
      JwtVerify.verifyToken,
      JwtVerify.verifyRole(["SUPER_ADMIN"]),
      this.performanceReportController.getPerformanceForSuperAdmin
    );
    this.router.get(
    "/outlet",
    JwtVerify.verifyToken,
    JwtVerify.verifyRole(["OUTLET_ADMIN"]),
    this.performanceReportController.getPerformanceForOutletAdmin
  );
  }

  getRouter(): Router {
    return this.router;
  }
}
