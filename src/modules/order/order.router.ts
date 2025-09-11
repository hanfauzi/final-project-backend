import { Router } from "express";
import { OrderController } from "./order.controller";
import { JwtVerify } from "../../middlewares/jwt-verify.middleware";
import { validateBody } from "../../middlewares/validate.middleware";
import { PickUpOrderDTO } from "./dto/pickup-order.dto";

export class OrderRouter {
  private router: Router;
  private orderController: OrderController;

  constructor() {
    this.router = Router();
    this.orderController = new OrderController();
    this.initializedRoutes();
  }
  private initializedRoutes = () => {
    this.router.post(
      "/create",
      JwtVerify.verifyToken,
      JwtVerify.verifyRole(["CUSTOMER"]),
      validateBody(PickUpOrderDTO),
      this.orderController.createPickUpOrderRequest
    );
  };

  getRouter = () => {
    return this.router;
  };
}
