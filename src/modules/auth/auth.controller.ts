import { NextFunction, Request, Response } from "express";
import { AppError } from "../../utils/app.error";
import { AuthEmployeeService } from "./auth-employee.service";
import { AuthService } from "./auth.service";
import { GoogleService } from "./oauth/google.service";

export class AuthController {
  private authService: AuthService;
  private googleService: GoogleService;
  private authEmployeeService: AuthEmployeeService;
  constructor() {
    this.authService = new AuthService();
    this.googleService = new GoogleService();
    this.authEmployeeService = new AuthEmployeeService();
  }

  customerRegister = async (req: Request, res: Response) => {
    const result = await this.authService.customerRegister(req.body);
    res.status(200).json(result);
  };

  resendVerificationEmail = async (req: Request, res: Response) => {
    const result = await this.authService.resendVerificationEmail(req.body);
    res.status(200).json(result);
  };

  googleSignIn = async (req: Request, res: Response) => {
    const idToken = req.body.idToken as string;

    if (!idToken) throw new AppError("Google ID token is required", 400);
    const result = await this.googleService.googleSignIn(idToken);
    res.status(200).json(result);
  };

  setCustomerPassword = async (req: Request, res: Response) => {
    const { verifyToken } = req.params;
    if (!verifyToken) throw new AppError("Verify token is required", 400);

    const { password } = req.body;
    if (!password) throw new AppError("Password is required", 400);

    const result = await this.authService.setCustomerPassword({
      verifyToken,
      password,
    });

    return res.status(200).json(result);
  };

  customerLogin = async (req: Request, res: Response) => {
    const result = await this.authService.customerLogin(req.body);
    res.status(200).json(result);
  };

  sendCustomerForgotPasswordEmail = async (req: Request, res: Response) => {
    const result = await this.authService.sendCustomerForgotPasswordEmail(
      req.body
    );
    res.status(200).json(result);
  };

  resetCustomerPasswordByToken = async (req: Request, res: Response) => {
    const { token } = req.params;
    const { password } = req.body;

    const result = await this.authService.resetCustomerPasswordByToken({
      token,
      password,
    });

    res.status(200).json(result);
  };

  employeeLogin = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await this.authEmployeeService.employeeLogin(req.body);
      return res.status(200).json({
        message: "Employee logged in successfully",
        data: result,
      });
    } catch (error) {
      next(error);
    }
  };
}
