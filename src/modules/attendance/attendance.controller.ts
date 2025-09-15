import { Request, Response } from "express";
import { ClockInAttendanceService } from "./services/clockInAttendance.service";
import { ClockOutAttendanceService } from "./services/clockOutAttendance.service";
import { GetAttendanceByEmployeeService } from "./services/getAttendanceByEmployee.service";
import { GetAttendanceByAdminService } from "./services/getAttendanceByAdmin.service";
import { plainToInstance } from "class-transformer";
import { GetAttendanceByAdminDTO } from "./dto/getAttendanceByAdmin.dto";
import { GetAttendanceByEmployeeDTO } from "./dto/getAttendanceByEmployee";

export class AttendanceController {
  private clockInAttendanceService: ClockInAttendanceService;
  private clockOutAttendanceService: ClockOutAttendanceService;
  private getAttendanceByEmployeeService: GetAttendanceByEmployeeService;
  private getAttendanceByAdminService: GetAttendanceByAdminService;

  constructor() {
    this.clockInAttendanceService = new ClockInAttendanceService();
    this.clockOutAttendanceService = new ClockOutAttendanceService();
    this.getAttendanceByEmployeeService = new GetAttendanceByEmployeeService();
    this.getAttendanceByAdminService = new GetAttendanceByAdminService();
  }

  clockInAttendance = async (req: Request, res: Response) => {
    const authUser = res.locals.payload;
    const result = await this.clockInAttendanceService.clockInAttendance(req.body, authUser);
    res.status(200).json(result);
  };

  clockOutAttendance = async (req: Request, res: Response) => {
    const authUser = res.locals.payload;
    const result = await this.clockOutAttendanceService.clockOutAttendance(req.body, authUser);
    res.status(200).json(result);
  };

  getAttendanceByEmployee = async (req: Request, res: Response) => {
    const query = plainToInstance(GetAttendanceByEmployeeDTO, req.query);
    const authUser = res.locals.payload;
    const result = await this.getAttendanceByEmployeeService.getAttendanceByEmployee(authUser, query);
    res.status(200).json(result);
  };

  getAttendanceByAdmin = async (req: Request, res: Response) => {
    const query = plainToInstance(GetAttendanceByAdminDTO, req.query);
    const authUser = res.locals.payload;
    const result = await this.getAttendanceByAdminService.getAttendanceByAdmin(authUser, query);
    res.status(200).json(result);
  };
}
