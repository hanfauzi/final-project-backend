import { Router } from "express";
import { JwtVerify } from "../../middlewares/jwt-verify.middleware";
import { PaymentController } from "./payment.controller";

export class PaymentRouter {
  private router: Router;
  private paymentController: PaymentController;
  constructor() {
    this.router = Router();
    this.paymentController = new PaymentController();
    this.initializedRoutes();
  }
  private initializedRoutes = () => {
    this.router.post(
      "/snap",
      JwtVerify.verifyToken,
      JwtVerify.verifyRole(["CUSTOMER"]),
      this.paymentController.createOrReusePayment
    );

    this.router.get(
      "/",
      JwtVerify.verifyToken,
      JwtVerify.verifyRole(["CUSTOMER", "OUTLET_ADMIN"]),
      this.paymentController.getPayment
    );

    this.router.post(
      "/midtrans/webhook",
      this.paymentController.midtransWebhook
    );

    this.router.post("/manual-webhook", this.paymentController.manualWebhook);
  };

  getRouter = () => {
    return this.router;
  };
}
