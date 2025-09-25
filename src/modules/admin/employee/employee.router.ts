import { Router } from "express";
import { fileValidationMiddleware } from "../../../middlewares/file-validation.middleware";
import { JwtVerify } from "../../../middlewares/jwt-verify.middleware";
import { UploaderMiddleware } from "../../../middlewares/uploader.middleware";
import { validateBody } from "../../../middlewares/validate.middleware";
import { CreateEmployeeDTO } from "./dto/create.employee.dto";
import { UpdateEmployeeDTO } from "./dto/update.employee.dto";
import { EmployeeController } from "./employee.controller";

export class EmployeeRouter {
  private router: Router;
  private employeeController: EmployeeController;
  private uploaderMiddleware: UploaderMiddleware;

  constructor() {
    this.employeeController = new EmployeeController();
    this.router = Router();
    this.uploaderMiddleware = new UploaderMiddleware();
    this.initializeRoutes();
  }

  private initializeRoutes(): void {
    this.router.get(
      "/",
      JwtVerify.verifyToken,
      JwtVerify.verifyRole(["SUPER_ADMIN"]),
      this.employeeController.getAllEmployees
    );

    this.router.get(
      "/:id",
      JwtVerify.verifyToken,
      JwtVerify.verifyRole(["SUPER_ADMIN", "OUTLET_ADMIN"]),
      this.employeeController.getEmployeeDetailById
    );

    this.router.post(
      "/",
      JwtVerify.verifyToken,
      JwtVerify.verifyRole(["SUPER_ADMIN"]),
      this.uploaderMiddleware.upload(2).single("photo"),
      fileValidationMiddleware(["image/jpeg", "image/png"]),
      validateBody(CreateEmployeeDTO),
      this.employeeController.createEmployeeBySuperAdmin
    );

    this.router.patch(
      "/:id",
      JwtVerify.verifyToken,
      JwtVerify.verifyRole(["SUPER_ADMIN"]),
      this.uploaderMiddleware.upload(2).single("photo"),
      fileValidationMiddleware(["image/jpeg", "image/png"]),
      validateBody(UpdateEmployeeDTO),
      this.employeeController.updateEmployeeBySuperAdmin
    );

    this.router.delete(
      "/:id",
      JwtVerify.verifyToken,
      JwtVerify.verifyRole(["SUPER_ADMIN"]),
      this.employeeController.deleteEmployeeBySuperAdmin
    );

  }

  getRouter(): Router {
    return this.router;
  }
}
