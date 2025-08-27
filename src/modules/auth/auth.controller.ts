import { Request, Response } from "express";
import { AuthService } from "./auth.service";
import { GoogleService } from "./oauth/google.service";
import { AppError } from "../../utils/app.error";

export class AuthController {
  private authService: AuthService;
  private googleService: GoogleService;
  constructor() {
    this.authService = new AuthService();
    this.googleService = new GoogleService();
  }

  customerRegister = async (req: Request, res: Response) => {
    const result = await this.authService.customerRegister(req.body);
    res.status(200).json(result);
  };

  resendVerificationEmail = async (req: Request, res: Response) => {
    const result = await this.authService.resendVerificationEmail(req.body);
    res.status(200).json(result);
  };

  googleLoginRegister = async (req: Request, res: Response) => {
   const auth = req.headers.authorization;
    const idToken =
      auth?.startsWith("Bearer ") ? auth.slice(7) : undefined;

    if (!idToken) throw new AppError("Google ID token is required", 400);
    const result = await this.googleService.googleLoginRegister(idToken);
    res.status(200).json(result);
  };
}
