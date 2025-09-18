import { Router } from "express";
import { ShiftController } from "./shift.controller";
import { JwtVerify } from "../../../middlewares/jwt-verify.middleware";

export class ShiftRouter {
  private shiftController: ShiftController;
  private router: Router;

  constructor() {
    this.shiftController = new ShiftController();
    this.router = Router();
    this.initializeRoutes();
  }

  private initializeRoutes(): void {
    this.router.get(
      "/",
      JwtVerify.verifyToken,
      JwtVerify.verifyRole(["SUPER_ADMIN"]),
      this.shiftController.getAllShifts
    );
  }

  getRouter(): Router {
    return this.router;
  }
}
