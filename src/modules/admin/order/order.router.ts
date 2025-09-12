import { Router } from "express";
import { OrderAdminController } from "./order.controller";
import { JwtVerify } from "../../../middlewares/jwt-verify.middleware";
import { validateQuery } from "../../../middlewares/validate-query.middleware";
import { GetAllOrdersDto } from "./dto/get-all-orders.dto";

export class OrderAdminRouter {
  private orderAdminController: OrderAdminController;
  private router: Router;

  constructor() {
    this.orderAdminController = new OrderAdminController();
    this.router = Router();
    this.initializeRoutes();
  }

  private initializeRoutes(): void {
    this.router.get(
      "/",
      JwtVerify.verifyToken,
      JwtVerify.verifyRole(["SUPER_ADMIN"]),
      this.orderAdminController.getAllOrders
    );
    this.router.get(
      "/outlet",
      JwtVerify.verifyToken,
      JwtVerify.verifyRole(["OUTLET_ADMIN"]),
      validateQuery(GetAllOrdersDto),
      this.orderAdminController.getAllOrdersForOutletAdmin
    );
    this.router.get(
      "/:id",
      JwtVerify.verifyToken,
      JwtVerify.verifyRole(["SUPER_ADMIN", "OUTLET_ADMIN"]),
      this.orderAdminController.getOrderDetailById
    );
    
  }

  getRouter(): Router {
    return this.router;
  }
}
