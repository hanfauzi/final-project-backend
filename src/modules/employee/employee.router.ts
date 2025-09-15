import { Router } from "express";
import { EmployeeController } from "./employee.controller";
import { JwtVerify } from "../../middlewares/jwt-verify.middleware";

export class EmployeeRouter {
  private router: Router;
  private employeeController: EmployeeController;
  constructor() {
    this.router = Router();
    this.employeeController = new EmployeeController();
    this.initializedRoutes();
  }

  private initializedRoutes = () => {
    this.router.get(
      "/get-employee",
      JwtVerify.verifyToken,
      this.employeeController.getEmployee
    );
  };

  getRouter = () => {
    return this.router;
  };
}
