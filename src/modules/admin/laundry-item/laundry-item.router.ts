import { Router } from "express";
import { LaundryItemController } from "./laundry-item.controller";
import { JwtVerify } from "../../../middlewares/jwt-verify.middleware";
import { validateBody } from "../../../middlewares/validate.middleware";
import { CreateLaundryItemDTO, UpdateLaundryItemDTO } from "./dto/laundry-item.dto";

export class LaundryItemRouter {
  private laundryItemController: LaundryItemController;
  private router: Router;

  constructor() {
    this.laundryItemController = new LaundryItemController();
    this.router = Router();
    this.initializeRoutes();
  }

  private initializeRoutes(): void {
    this.router.get(
      "/",
      JwtVerify.verifyToken,
      JwtVerify.verifyRole(["SUPER_ADMIN", "OUTLET_ADMIN"]),
      this.laundryItemController.getAllLaundryItems
    );
    this.router.get(
      "/:id",
      JwtVerify.verifyToken,
      JwtVerify.verifyRole(["SUPER_ADMIN", "OUTLET_ADMIN"]),
      this.laundryItemController.getLaundryItemDetailById
    );
    this.router.post(
      "/",
      JwtVerify.verifyToken,
      JwtVerify.verifyRole(["SUPER_ADMIN"]),
      validateBody(CreateLaundryItemDTO),
      this.laundryItemController.createLaundryItem
    );
    this.router.patch(
      "/:id",
      JwtVerify.verifyToken,
      JwtVerify.verifyRole(["SUPER_ADMIN"]),
      validateBody(UpdateLaundryItemDTO),
      this.laundryItemController.updateLaundryItem
    );
    this.router.delete(
      "/:id",
      JwtVerify.verifyToken,
      JwtVerify.verifyRole(["SUPER_ADMIN"]),
      this.laundryItemController.deleteLaundryItem
    );
    this.router.patch(
      "/:id/restore",
      JwtVerify.verifyToken,
      JwtVerify.verifyRole(["SUPER_ADMIN"]),
      this.laundryItemController.restoreLaundryItem
    );
  }

  getRouter(): Router {
    return this.router;
  }
}