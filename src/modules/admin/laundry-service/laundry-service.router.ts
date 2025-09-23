import { Router } from "express";
import { JwtVerify } from "../../../middlewares/jwt-verify.middleware";
import { LaundryServiceController } from "./laundry-service.controller";

export class LaundryServiceRouter {
  private laundryServiceController: LaundryServiceController;
  private router: Router;

  constructor() {
    this.laundryServiceController = new LaundryServiceController();
    this.router = Router();
    this.initializeRoutes();
  }

  private initializeRoutes(): void {
    this.router.get("/", this.laundryServiceController.getAllServices);
  }

  getRouter(): Router {
    return this.router;
  }
}
