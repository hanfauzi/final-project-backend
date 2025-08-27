import { Router } from "express";
import { AuthController } from "./auth.controller";
import { validateBody } from "../../middlewares/validate.middleware";
import { RegisterDTO } from "./dto/register.dto";
import { GoogleIdTokenDTO } from "./dto/google.dto";
import { JwtVerify } from "../../middlewares/jwt-verify.middleware";

export class AuthRouter {
  private router: Router;
  private authController: AuthController;
  constructor() {
    this.router = Router();
    this.authController = new AuthController();
    this.initializedRoutes();
  }

  private initializedRoutes = () => {
    this.router.post(
      "/customer/register",
      validateBody(RegisterDTO),
      this.authController.customerRegister
    );

    this.router.post(
      "/customer/resend",
      validateBody(RegisterDTO),
      this.authController.resendVerificationEmail
    );

    this.router.post(
      "/customer/google",
      validateBody(GoogleIdTokenDTO),
      this.authController.googleLoginRegister
    );
  };

  getRouter = () => {
    return this.router;
  };
}
