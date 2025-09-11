// src/modules/admin/admin.router.ts
import { Router } from "express";
import { OutletRouter } from "./outlet/outlet.router";
import { EmployeeRouter } from "./employee/employee.router";
import { LaundryItemRouter } from "./laundry-item/laundry-item.router";

export class AdminRouter {
  private router: Router;
  private employeeRouter: EmployeeRouter;
  private outletRouter: OutletRouter;
  private laundryItemRouter: LaundryItemRouter;

  constructor() {
    this.router = Router();
    this.employeeRouter = new EmployeeRouter();
    this.outletRouter = new OutletRouter();
    this.laundryItemRouter = new LaundryItemRouter();
    this.initializeRoutes();
  }

  private initializeRoutes(): void {
    this.router.use("/employees", this.employeeRouter.getRouter());
    this.router.use("/outlets", this.outletRouter.getRouter());
    this.router.use("/laundry-items", this.laundryItemRouter.getRouter());
  }

  getRouter(): Router {
    return this.router;
  }
}
