// src/modules/admin/admin.router.ts
import { Router } from "express";
import { OutletRouter } from "./outlet/outlet.router";
import { EmployeeRouter } from "./employee/employee.router";

export class AdminRouter {
  private router: Router;
  private employeeRouter: EmployeeRouter;
  private outletRouter: OutletRouter;

  constructor() {
    this.router = Router();
    this.employeeRouter = new EmployeeRouter();
    this.outletRouter = new OutletRouter();
    this.initializeRoutes();
  }

  private initializeRoutes(): void {
    this.router.use("/employees", this.employeeRouter.getRouter());
    this.router.use("/outlets", this.outletRouter.getRouter());
  }

  getRouter(): Router {
    return this.router;
  }
}
