import express, {
  json,
  urlencoded,
  Express,
  Request,
  Response,
  NextFunction,
} from "express";
import cors from "cors";
import { PORT } from "./config/config";
import { AppError } from "./utils/app.error";
import { NotFoundMiddleware } from "./middlewares/not-found.middleware";
import { ErrorHandlerMiddleware } from "./middlewares/error-handler.middleware";
import { SampleRouter } from "./modules/sample/sample.router";
import { AuthRouter } from "./modules/auth/auth.router";
import { ProfileRouter } from "./modules/profile/profile.router";
import { AddressRouter } from "./modules/address/address.router";
import { AdminRouter } from "./modules/admin/admin.router";
import { OrderRouter } from "./modules/order/order.router";
import { AttendanceRouter } from "./modules/attendance/attendance.router";
import { EmployeeRouter } from "./modules/employee/employee.router";

export default class App {
  private app: Express;

  constructor() {
    this.app = express();
    this.configure();
    this.routes();
    this.handleError();
  }

  private configure(): void {
    this.app.use(cors());
    this.app.use(json());
    this.app.use(urlencoded({ extended: true }));
  }

  private handleError(): void {
    /*
      📒 Docs:
      This is a not found error handler.
    */
    this.app.use(NotFoundMiddleware.handle());

    /*
        📒 Docs:
        This is a centralized error-handling middleware.
    */
    this.app.use(ErrorHandlerMiddleware.handle());
  }

  private routes(): void {
    const sampleRouter = new SampleRouter();
    const authRouter = new AuthRouter();
    const profileRouter = new ProfileRouter();
    const addressRouter = new AddressRouter();
    const adminRouter = new AdminRouter();
    const orderRouter = new OrderRouter();
    const attendanceRouter = new AttendanceRouter();
    const employeeRouter = new EmployeeRouter();

    this.app.get("/api", (req: Request, res: Response) => {
      res.send(
        `Hello, Purwadhika student 👋. Have fun working on your mini project ☺️`
      );
    });

    this.app.use("/api", sampleRouter.getRouter());
    this.app.use("/api/auth", authRouter.getRouter());
    this.app.use("/api/profile", profileRouter.getRouter());
    this.app.use("/api/address", addressRouter.getRouter());
    this.app.use("/api/admin", adminRouter.getRouter());
    this.app.use("/api/order", orderRouter.getRouter());
    this.app.use("/api/attendance", attendanceRouter.getRouter());
    this.app.use("/api/employee", employeeRouter.getRouter());
  }

  public start(): void {
    this.app.listen(PORT, () => {
      console.log(`➜ [API] Local: http://localhost:${PORT}/`);
    });
  }
}
