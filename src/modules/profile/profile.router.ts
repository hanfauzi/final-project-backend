import { Router } from "express";
import { ProfileController } from "./profile.controller";
import { JwtVerify } from "../../middlewares/jwt-verify.middleware";

export class ProfileRouter {
  private router: Router;
  private profileController: ProfileController;
  constructor() {
    this.router = Router ()
    this.profileController = new ProfileController();
    this.initializedRoutes();
  }
  private initializedRoutes = () => {
    this.router.get(
      "/customer",
      JwtVerify.verifyToken,
      JwtVerify.verifyRole(["CUSTOMER"]),
      this.profileController.getCustomerProfileById
    );
  };
  getRouter = () => {
    return this.router;
  };
}
