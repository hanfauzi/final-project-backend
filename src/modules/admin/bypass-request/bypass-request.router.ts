import { Router } from "express";
import { JwtVerify } from "../../../middlewares/jwt-verify.middleware";
import { BypassRequestController } from "./bypass-request.controller";

export class BypassRequestRouter {
  private bypassRequestController: BypassRequestController;
  private router: Router;

  constructor() {
    this.bypassRequestController = new BypassRequestController();
    this.router = Router();
    this.initializeRoutes();
  }

  private initializeRoutes(): void {
    this.router.get(
      "/",
      JwtVerify.verifyToken,
      JwtVerify.verifyRole(["OUTLET_ADMIN"]),
      this.bypassRequestController.getRequests
    );
    this.router.patch(
      "/:taskId/review",
      JwtVerify.verifyToken,
      JwtVerify.verifyRole(["OUTLET_ADMIN"]),
      this.bypassRequestController.reviewBypass
    );
  }

  getRouter(): Router {
    return this.router;
  }
}
