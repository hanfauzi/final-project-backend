import { Router } from "express";
import { OrderController } from "./order.controller";
import { JwtVerify } from "../../middlewares/jwt-verify.middleware";
import { validateBody } from "../../middlewares/validate.middleware";
import { PickUpOrderDTO } from "./dto/pickup-order.dto";
import { requireVerifiedCustomer } from "../../middlewares/require-verified.middleware";

export class OrderRouter {
  private router: Router;
  private orderController: OrderController;

  constructor() {
    this.router = Router();
    this.orderController = new OrderController();
    this.initializedRoutes();
  }
  private initializedRoutes = () => {
    this.router.get(
      "/suggest-outlet",
      JwtVerify.verifyToken,
      JwtVerify.verifyRole(["CUSTOMER"]),
      this.orderController.suggestPickUpOutlet
    );

    this.router.post(
      "/create",
      JwtVerify.verifyToken,
      JwtVerify.verifyRole(["CUSTOMER"]),
      requireVerifiedCustomer,
      validateBody(PickUpOrderDTO),
      this.orderController.createPickUpOrderRequest
    );

    this.router.post(
      "/cancel/:id",
      JwtVerify.verifyToken,
      JwtVerify.verifyRole(["CUSTOMER"]),
      requireVerifiedCustomer,
      this.orderController.cancelPickUpOrderRequest
    );

    this.router.get(
      "/pickups",
      JwtVerify.verifyToken,
      JwtVerify.verifyRole(["CUSTOMER"]),
      this.orderController.getCustomerPickUpOrders
    );

    this.router.get(
      "/pickup/:id",
      JwtVerify.verifyToken,
      JwtVerify.verifyRole(["CUSTOMER"]),
      this.orderController.getCustomerPickUpOrderById
    );

    this.router.get(
      "/",
      JwtVerify.verifyToken,
      JwtVerify.verifyRole(["CUSTOMER"]),
      this.orderController.getCustomerOrders
    );

    this.router.get(
      "/:id",
      JwtVerify.verifyToken,
      JwtVerify.verifyRole(["CUSTOMER"]),
      this.orderController.getCustomerOrderById
    );

    this.router.get(
      "/deliveries",
      JwtVerify.verifyToken,
      JwtVerify.verifyRole(["CUSTOMER"]),
      this.orderController.getCustomerDeliveryOrders
    );

    this.router.get(
      "/delivery/:id",
      JwtVerify.verifyToken,
      JwtVerify.verifyRole(["CUSTOMER"]),
      this.orderController.getCustomerDeliveryOrderById
    );

    this.router.patch(
      "/confirm/:orderHeaderId",
      JwtVerify.verifyToken,
      JwtVerify.verifyRole(["CUSTOMER"]),
      this.orderController.confirmRecivedByCustomer
    );
  };

  getRouter = () => {
    return this.router;
  };
}
