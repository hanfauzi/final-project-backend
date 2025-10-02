import { Router } from "express";
import { JwtVerify } from "../../middlewares/jwt-verify.middleware";
import { DeliveryOrderController } from "./deliveryOrder.controller";
import { AttendanceMiddleware } from "../../middlewares/attendance.middleware";

export class DeliveryOrderRouter {
  private router: Router;
  private deliveryOrderController: DeliveryOrderController;
  constructor() {
    this.router = Router();
    this.deliveryOrderController = new DeliveryOrderController();
    this.initializedRoutes();
  }

  private initializedRoutes = () => {
    this.router.get(
      "/get-delivery-orders-by-driver",
      JwtVerify.verifyToken,
      this.deliveryOrderController.getDeliveryOrdersByDriver
    );

    this.router.get(
      "/:id",
      JwtVerify.verifyToken,
      this.deliveryOrderController.getDeliveryOrderById
    );

    this.router.patch(
      "/:id/process-delivery-order",
      JwtVerify.verifyToken,
      AttendanceMiddleware.checkClockIn,
      this.deliveryOrderController.processDeliveryOrder
    );
  };

  getRouter = () => {
    return this.router;
  };
}
