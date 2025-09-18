// src/modules/admin/admin.router.ts
import { Router } from "express";
import { OutletRouter } from "./outlet/outlet.router";
import { EmployeeRouter } from "./employee/employee.router";
import { LaundryItemRouter } from "./laundry-item/laundry-item.router";
import { OrderAdminRouter } from "./order/order.router";
import { ShiftRouter } from "./shift/shift.router";

export class AdminRouter {
  private router: Router;
  private employeeRouter: EmployeeRouter;
  private outletRouter: OutletRouter;
  private laundryItemRouter: LaundryItemRouter;
  private orderAdminRouter: OrderAdminRouter;
  private shiftRouter: ShiftRouter;

  constructor() {
    this.router = Router();
    this.employeeRouter = new EmployeeRouter();
    this.outletRouter = new OutletRouter();
    this.laundryItemRouter = new LaundryItemRouter();
    this.orderAdminRouter = new OrderAdminRouter();
    this.shiftRouter = new ShiftRouter()

    this.initializeRoutes();
  }

  private initializeRoutes(): void {
    this.router.use("/employees", this.employeeRouter.getRouter());
    this.router.use("/outlets", this.outletRouter.getRouter());
    this.router.use("/laundry-items", this.laundryItemRouter.getRouter());
    this.router.use("/orders", this.orderAdminRouter.getRouter());
    this.router.use("/shifts", this.shiftRouter.getRouter())
  }

  getRouter(): Router {
    return this.router;
  }
}
