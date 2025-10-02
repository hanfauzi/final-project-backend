import { Router } from "express";
import { JwtVerify } from "../../middlewares/jwt-verify.middleware";
import { WorkerTaskController } from "./workerTask.controller";
import { AttendanceMiddleware } from "../../middlewares/attendance.middleware";

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
      this.workerTaskController.getWorkerTasksByWorker
    );

    this.router.get(
      "/:id",
      JwtVerify.verifyToken,
      this.workerTaskController.getWorkerTaskById
    );
    
    this.router.post(
      "/validate-worker-recount",
      JwtVerify.verifyToken,
      AttendanceMiddleware.checkClockIn,
      this.workerTaskController.validateWorkerReCount
    );

    this.router.patch(
      "/:id/process-worker-task",
      JwtVerify.verifyToken,
      AttendanceMiddleware.checkClockIn,
      this.workerTaskController.processWorkerTask
    );

    this.router.patch(
      "/:id/request-bypass",
      JwtVerify.verifyToken,
      AttendanceMiddleware.checkClockIn,
      this.workerTaskController.reqWorkerTaskBypass
    );
  };

  getRouter = () => {
    return this.router;
  };  
}
