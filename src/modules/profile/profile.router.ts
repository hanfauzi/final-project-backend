import { Router } from "express";
import { ProfileController } from "./profile.controller";
import { JwtVerify } from "../../middlewares/jwt-verify.middleware";
import { UploaderMiddleware } from "../../middlewares/uploader.middleware";
import { validateBody } from "../../middlewares/validate.middleware";
import { CustomerProfileUpdateDTO } from "./dto/customer.dto";
import { CustomerEmailUpdateDTO } from "./dto/customer.email.dto";
import { CustomerPasswordDTO } from "./dto/customer.password.dto";

export class ProfileRouter {
  private router: Router;
  private profileController: ProfileController;
  private uploaderMiddleware: UploaderMiddleware;
  constructor() {
    this.router = Router();
    this.profileController = new ProfileController();
    this.uploaderMiddleware = new UploaderMiddleware();
    this.initializedRoutes();
  }
  private initializedRoutes = () => {
    this.router.get(
      "/customer",
      JwtVerify.verifyToken,
      JwtVerify.verifyRole(["CUSTOMER"]),
      this.profileController.getCustomerProfileById
    );

    this.router.patch(
      "/edit",
      JwtVerify.verifyToken,
      JwtVerify.verifyRole(["CUSTOMER"]),
      this.uploaderMiddleware.upload().single("photoUrl"),
      validateBody(CustomerProfileUpdateDTO),
      this.profileController.customerProfileUpdate
    );

    this.router.patch(
      "/edit/email",
      JwtVerify.verifyToken,
      JwtVerify.verifyRole(["CUSTOMER"]),
      validateBody(CustomerEmailUpdateDTO),
      this.profileController.customerEmailUpdate
    );
    
    this.router.patch(
      "/edit/password",
      JwtVerify.verifyToken,
      JwtVerify.verifyRole(["CUSTOMER"]),
      validateBody(CustomerPasswordDTO),
      this.profileController.customerPasswordUpdate
    );

    this.router.post(
      "/email/:token",
      this.profileController.verifyEmailByToken
    );

  };
  getRouter = () => {
    return this.router;
  };
}
