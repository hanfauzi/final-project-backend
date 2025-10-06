import { Router } from "express";
import { JwtVerify } from "../../middlewares/jwt-verify.middleware";
import { WorkerTaskController } from "./workerTask.controller";
import { AttendanceMiddleware } from "../../middlewares/attendance.middleware";
import { ValidateWorkerReCountDTO } from "./dto/validateWorkerReCount.dto";
import { validateBody } from "../../middlewares/validate.middleware";

export class WorkerTaskRouter {
  private router: Router;
  private workerTaskController: WorkerTaskController;
  constructor() {
    this.router = Router();
    this.workerTaskController = new WorkerTaskController();
    this.initializedRoutes();
  }

  private initializedRoutes = () => {
    this.router.get(
      "/get-worker-tasks-by-worker",
      JwtVerify.verifyToken,
      JwtVerify.verifyRole(["WORKER"]),
      this.workerTaskController.getWorkerTasksByWorker
    );

    this.router.get(
      "/:id",
      JwtVerify.verifyToken,
      JwtVerify.verifyRole(["WORKER"]),
      this.workerTaskController.getWorkerTaskById
    );
    
    this.router.post(
      "/validate-worker-recount",
      validateBody(ValidateWorkerReCountDTO),
      JwtVerify.verifyToken,
      JwtVerify.verifyRole(["WORKER"]),
      AttendanceMiddleware.checkClockIn,
      this.workerTaskController.validateWorkerReCount
    );

    this.router.patch(
      "/:id/process-worker-task",
      JwtVerify.verifyToken,
      JwtVerify.verifyRole(["WORKER"]),
      AttendanceMiddleware.checkClockIn,
      this.workerTaskController.processWorkerTask
    );

    this.router.patch(
      "/:id/request-bypass",
      JwtVerify.verifyToken,
      JwtVerify.verifyRole(["WORKER"]),
      AttendanceMiddleware.checkClockIn,
      this.workerTaskController.reqWorkerTaskBypass
    );
  };

  getRouter = () => {
    return this.router;
  };  
}
