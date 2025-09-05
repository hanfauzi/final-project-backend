import { NextFunction, Request, Response } from "express";
import { AdminService } from "./admin.service";
import { CloudinaryService } from "../../cloudinary/cloudinary.service";
import { AppError } from "../../utils/app.error";

export class AdminController {
  private adminService: AdminService;
  private cloudinaryService: CloudinaryService;
  constructor() {
    this.adminService = new AdminService();
    this.cloudinaryService = new CloudinaryService();
  }

  getAllEmployees = async (_: Request, res: Response, next: NextFunction) => {
    try {
      const employees = await this.adminService.getAllEmployees();
      res.status(200).json({ data: employees });
    } catch (error) {
      next(error);
    }
  };

  createEmployeeBySuperAdmin = async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const file = req.file;

      if (file) {
        try {
          const uploadResult = await this.cloudinaryService.upload(
            file,
            "employees"
          );
          req.body.photoUrl = uploadResult.secure_url;
        } catch (uploadError) {
          console.error("Cloudinary upload failed:", uploadError);
          return res.status(500).json({
            message: "Failed to upload image to Cloudinary",
          });
        }
      }
      
      const employee = await this.adminService.createEmployeeBySuperAdmin(
        req.body
      );
      res.status(201).json({ data: employee });
    } catch (error) {
      next(error);
    }
  };

  updateEmployeeBySuperAdmin = async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const { id } = req.params;
      const file = req.file;
      const data = req.body;

       if (file) {
      try {
        const uploadResult = await this.cloudinaryService.upload(
          file,
          "employees"
        );
        req.body.photoUrl = uploadResult.secure_url;
      } catch (uploadError) {
        console.error("Cloudinary upload failed:", uploadError);
        throw new AppError("Failed to upload image to Cloudinary", 500);
      }
    }

      const updated = await this.adminService.updateEmployeeBySuperAdmin(
        id,
        data
      );
      return res.status(200).json({
        message: "Employee updated successfully",
        data: updated,
      });
    } catch (error) {
      next(error);
    }
  };

  deleteEmployeeBySuperAdmin = async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const { id } = req.params;

      const deletedEmployee =
        await this.adminService.deleteEmployeeBySuperAdmin(id);

      return res.status(200).json({
        message: "Employee deleted successfully",
        data: deletedEmployee,
      });
    } catch (error) {
      next(error);
    }
  };
}
