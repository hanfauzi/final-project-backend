import { Router } from "express";
import { validateBody } from "../../middlewares/validate.middleware";
import { JwtVerify } from "../../middlewares/jwt-verify.middleware";
import { AttendanceController } from "./attendance.controller";
import { ClockInAttendanceDTO } from "./dto/clockInAttendance.dto";
import { ClockOutAttendanceDTO } from "./dto/clockOutAttendance.dto";

export class AttendanceRouter {
  private router: Router;
  private attendanceController: AttendanceController;
  constructor() {
    this.router = Router();
    this.attendanceController = new AttendanceController();
    this.initializedRoutes();
  }

  private initializedRoutes = () => {
    this.router.post(
      "/clock-in",
      validateBody(ClockInAttendanceDTO),
      JwtVerify.verifyToken,
      JwtVerify.verifyRole(["SUPER_ADMIN", "OUTLET_ADMIN", "DRIVER", "WORKER"]),
      this.attendanceController.clockInAttendance
    );

    this.router.patch(
      "/clock-out",
      validateBody(ClockOutAttendanceDTO),
      JwtVerify.verifyToken,
      JwtVerify.verifyRole(["SUPER_ADMIN", "OUTLET_ADMIN", "DRIVER", "WORKER"]),
      this.attendanceController.clockOutAttendance
    );

    this.router.get(
      "/get-attendance-by-employee",
      JwtVerify.verifyToken,
      JwtVerify.verifyRole(["SUPER_ADMIN", "OUTLET_ADMIN", "DRIVER", "WORKER"]),
      this.attendanceController.getAttendanceByEmployee
    );

    this.router.get(
      "/get-attendance-by-admin",
      JwtVerify.verifyToken,
      JwtVerify.verifyRole(["SUPER_ADMIN", "OUTLET_ADMIN"]),
      this.attendanceController.getAttendanceByAdmin
    );
  };

  getRouter = () => {
    return this.router;
  };
}
