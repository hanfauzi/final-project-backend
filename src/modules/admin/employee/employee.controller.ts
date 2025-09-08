import { NextFunction, Request, Response } from "express";
import { EmployeeService } from "./employee.service";
import { CloudinaryService } from "../../../cloudinary/cloudinary.service";
import { AppError } from "../../../utils/app.error";
import { AssignmentService } from "../assignment/assignment.service";

export class EmployeeController {
  private employeeService: EmployeeService;
  private cloudinaryService: CloudinaryService;
  private assignmentService: AssignmentService;
  constructor() {
    this.employeeService = new EmployeeService();
    this.cloudinaryService = new CloudinaryService();
    this.assignmentService = new AssignmentService();
  }

  getAllEmployees = async (_: Request, res: Response, next: NextFunction) => {
    try {
      const employees = await this.employeeService.getAllEmployees();
      res.status(200).json({ data: employees });
    } catch (error) {
      next(error);
    }
  };

  getEmployeeDetailById = async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const { id } = req.params;
      const employee = await this.employeeService.getEmployeeDetailById(id);
      res.status(200).json({ message: "Get employee detail successfully", data: employee });
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

      const employee = await this.employeeService.createEmployeeBySuperAdmin(
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

      const updated = await this.employeeService.updateEmployeeBySuperAdmin(
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
        await this.employeeService.deleteEmployeeBySuperAdmin(id);

      return res.status(200).json({
        message: "Employee deleted successfully",
        data: deletedEmployee,
      });
    } catch (error) {
      next(error);
    }
  };

  assignEmployeeToOutlet = async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const { id: employeeId } = req.params;
      const { outletId } = req.body;
      const result = await this.assignmentService.assignEmployeeToOutlet(
        employeeId,
        outletId
      );
      res.status(200).json({ message: `${result.name} has been assigned to outlet ${result.outlets?.name}` ,data: result });
    } catch (err) {
      next(err);
    }
  };

  unnasignEmployeeFromOutlet = async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const { id: employeeId } = req.params;
      const result =
        await this.assignmentService.unassignEmployeeFromOutlet(employeeId);
      res.status(200).json({message: `${result.name} has been unassigned`, data: result });
    } catch (err) {
      next(err);
    }
  };
}
