import { Router } from "express";
import { JwtVerify } from "../../middlewares/jwt-verify.middleware";
import { PickUpOrderController } from "./pickUpOrder.controller";
import { AttendanceMiddleware } from "../../middlewares/attendance.middleware";

export class PickUpOrderRouter {
  private router: Router;
  private pickUpOrderController: PickUpOrderController;
  constructor() {
    this.router = Router();
    this.pickUpOrderController = new PickUpOrderController();
    this.initializedRoutes();
  }

  private initializedRoutes = () => {
    this.router.get(
      "/get-pickup-orders-by-driver",
      JwtVerify.verifyToken,
      JwtVerify.verifyRole(["DRIVER"]),
      this.pickUpOrderController.getPickUpOrdersByDriver
    );

    this.router.get(
      "/:id",
      JwtVerify.verifyToken,
      JwtVerify.verifyRole(["DRIVER"]),
      this.pickUpOrderController.getPickUpOrderById
    );

    this.router.patch(
      "/:id/process-pickup-order",
      JwtVerify.verifyToken,
      JwtVerify.verifyRole(["DRIVER"]),
      AttendanceMiddleware.checkClockIn,
      this.pickUpOrderController.processPickUpOrder
    );
  };

  getRouter = () => {
    return this.router;
  };
}
