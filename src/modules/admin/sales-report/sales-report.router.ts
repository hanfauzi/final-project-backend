import { Router } from "express";
import { SalesReportController } from "./sales-report.controller";
import { JwtVerify } from "../../../middlewares/jwt-verify.middleware";

export class SalesReportRouter {

  private router: Router;
  private salesReportController: SalesReportController;

  constructor() {
    this.salesReportController = new SalesReportController();
    this.router = Router();
    this.initializeRoutes();
  }

  private initializeRoutes(): void {
    this.router.get("/", JwtVerify.verifyToken, JwtVerify.verifyRole(["SUPER_ADMIN"]), this.salesReportController.forSuperAdmin)
    this.router.get("/outlet", JwtVerify.verifyToken, JwtVerify.verifyRole(["OUTLET_ADMIN"]), this.salesReportController.forOutletAdmin)
  }

  getRouter(): Router {
    return this.router;
  }
}
