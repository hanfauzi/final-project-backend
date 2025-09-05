import { Router } from "express";
import { JwtVerify } from "../../middlewares/jwt-verify.middleware";
import { AdminController } from "./admin.controller";
import { validateBody } from "../../middlewares/validate.middleware";
import { CreateEmployeeDTO } from "./dto/create.employee.dto";
import { UpdateEmployeeDTO } from "./dto/update.employee.dto";
import { UploaderMiddleware } from "../../middlewares/uploader.middleware";
import { fileValidationMiddleware } from "../../middlewares/file-validation.middleware";

export class AdminRouter {
  private router: Router;
  private adminController: AdminController;
  private uploaderMiddleware: UploaderMiddleware;

  constructor() {
    this.adminController = new AdminController();
    this.router = Router();
    this.uploaderMiddleware = new UploaderMiddleware();
    this.initializeRoutes();
  }

  private initializeRoutes(): void {
    this.router.get(
      "/employees",
      JwtVerify.verifyToken,
      JwtVerify.verifyRole(["SUPER_ADMIN"]),
      this.adminController.getAllEmployees
    );

    this.router.post(
      "/employees",
      JwtVerify.verifyToken,
      JwtVerify.verifyRole(["SUPER_ADMIN"]),
      this.uploaderMiddleware.upload(2).single("photo"),
      fileValidationMiddleware(["image/jpeg", "image/png"]),
      validateBody(CreateEmployeeDTO),
      this.adminController.createEmployeeBySuperAdmin
    );

    this.router.patch(
      "/employees/:id",
      JwtVerify.verifyToken,
      JwtVerify.verifyRole(["SUPER_ADMIN"]),
      this.uploaderMiddleware.upload(2).single("photo"),
      fileValidationMiddleware(["image/jpeg", "image/png"]),
      validateBody(UpdateEmployeeDTO),
      this.adminController.updateEmployeeBySuperAdmin
    );

    this.router.delete(
      "/employees/:id",
      JwtVerify.verifyToken,
      JwtVerify.verifyRole(["SUPER_ADMIN"]),
      this.adminController.deleteEmployeeBySuperAdmin
    );
  }

  getRouter(): Router {
    return this.router;
  }
}
