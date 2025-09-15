import { Request, Response } from "express";
import { GetEmployeeService } from "./services/getEmployee.service";

export class EmployeeController {
  private getEmployeeService: GetEmployeeService;

  constructor() {
    this.getEmployeeService = new GetEmployeeService();
  }

  getEmployee = async (req: Request, res: Response) => {
      const authUser = res.locals.payload;
      const result = await this.getEmployeeService.getEmployee(authUser);
      res.status(200).json(result);
    };
}
