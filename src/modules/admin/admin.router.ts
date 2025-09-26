// src/modules/admin/admin.router.ts
import { Router } from "express";
import { OutletRouter } from "./outlet/outlet.router";
import { EmployeeRouter } from "./employee/employee.router";
import { LaundryItemRouter } from "./laundry-item/laundry-item.router";
import { OrderAdminRouter } from "./order/order.router";
import { ShiftRouter } from "./shift/shift.router";
import { LaundryServiceRouter } from "./laundry-service/laundry-service.router";
import { SalesReportRouter } from "./sales-report/sales-report.router";
import { PerformanceReportRouter } from "./performance-report/performance-report.router";
import { BypassRequestRouter } from "./bypass-request/bypass-request.router";

export class AdminRouter {
  private router: Router;
  private employeeRouter: EmployeeRouter;
  private outletRouter: OutletRouter;
  private laundryItemRouter: LaundryItemRouter;
  private orderAdminRouter: OrderAdminRouter;
  private shiftRouter: ShiftRouter;
  private laundryServiceRouter: LaundryServiceRouter;
  private salesReportRouter: SalesReportRouter;
  private performanceReportRouter: PerformanceReportRouter;
  private bypassRequestRouter: BypassRequestRouter;


  constructor() {
    this.router = Router();
    this.employeeRouter = new EmployeeRouter();
    this.outletRouter = new OutletRouter();
    this.laundryItemRouter = new LaundryItemRouter();
    this.orderAdminRouter = new OrderAdminRouter();
    this.shiftRouter = new ShiftRouter()
    this.laundryServiceRouter = new LaundryServiceRouter();
    this.salesReportRouter = new SalesReportRouter();
    this.performanceReportRouter = new PerformanceReportRouter();
    this.bypassRequestRouter = new BypassRequestRouter();


    this.initializeRoutes();
  }

  private initializeRoutes(): void {
    this.router.use("/employees", this.employeeRouter.getRouter());
    this.router.use("/outlets", this.outletRouter.getRouter());
    this.router.use("/laundry-items", this.laundryItemRouter.getRouter());
    this.router.use("/orders", this.orderAdminRouter.getRouter());
    this.router.use("/shifts", this.shiftRouter.getRouter())
    this.router.use("/laundry-services", this.laundryServiceRouter.getRouter())
    this.router.use("/sales-reports", this.salesReportRouter.getRouter());
    this.router.use("/performance-reports", this.performanceReportRouter.getRouter());
    this.router.use("/bypass-requests", this.bypassRequestRouter.getRouter());
  }

  getRouter(): Router {
    return this.router;
  }
}
