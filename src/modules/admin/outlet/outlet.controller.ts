import { NextFunction, Request, Response } from "express";
import { OutletService } from "./outlet.service";
import { AssignmentService } from "../assignment/assignment.service";

export class OutletController {
  private outletService: OutletService;
  private assignmentService: AssignmentService;
  constructor() {
    this.outletService = new OutletService();
    this.assignmentService = new AssignmentService();
  }

  getAllOutlets = async (req: Request, res: Response, next: NextFunction) => {
    const { page = "1", limit = "10", sortBy, sortOrder, search } = req.query;
    const outlets = await this.outletService.getAllOutlets({
      page: Number(page),
      limit: Number(limit),
      sortBy: sortBy as string,
      sortOrder: sortOrder as "asc" | "desc",
      search: search as string,
    });
    res
      .status(200)
      .json({ message: "Get all outlets data successfully", ...outlets });
  };

  getOutletDetailById = async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const { id } = req.params;
      const outlet = await this.outletService.getOutletDetailById(id);
      res
        .status(200)
        .json({ message: "Get outlet detail successfully", data: outlet });
    } catch (error) {
      next(error);
    }
  };

  createOutlet = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const outlet = await this.outletService.createOutlet(req.body);
      res
        .status(201)
        .json({ message: "Outlet created successfully", data: outlet });
    } catch (error) {
      next(error);
    }
  };

  updateOutlet = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const data = req.body;
      const outlet = await this.outletService.updateOutlet(id, data);
      res
        .status(200)
        .json({ message: "Outlet updated successfully", data: outlet });
    } catch (error) {
      next(error);
    }
  };

  deleteOutlet = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      await this.outletService.deleteOutlet(id);
      res.status(200).json({ message: "Outlet deleted successfully" });
    } catch (error) {
      next(error);
    }
  };

  assignEmployee = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id: outletId } = req.params;
      const { employeeId } = req.body;
      const result = await this.assignmentService.assignEmployeeToOutlet(
        employeeId,
        outletId
      );
      res
        .status(200)
        .json({
          message: `${result.name} has been assigned to outlet ${result.outlet?.name}`,
          data: result,
        });
    } catch (err) {
      next(err);
    }
  };

  getAssignedEmployeesByOutlet = async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const { id: outletId } = req.params;
      const result =
        await this.assignmentService.getAssignedEmployeesByOutlet(outletId);
      res.status(200).json({ data: result });
    } catch (err) {
      next(err);
    }
  };

  restoreOutlet = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const outlet = await this.outletService.restoreOutlet(id);
      res
        .status(200)
        .json({ message: "Outlet restored successfully", data: outlet });
    } catch (error) {
      next(error);
    }
  };
}
