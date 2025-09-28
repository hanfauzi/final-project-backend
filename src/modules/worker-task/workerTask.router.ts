import { Router } from "express";
import { JwtVerify } from "../../middlewares/jwt-verify.middleware";
import { WorkerTaskController } from "./workerTask.controller";

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
      this.workerTaskController.validateWorkerReCount
    );

    this.router.patch(
      "/:id/process-worker-task",
      JwtVerify.verifyToken,
      this.workerTaskController.processWorkerTask
    );

    this.router.patch(
      "/:id/request-bypass",
      JwtVerify.verifyToken,
      this.workerTaskController.reqWorkerTaskBypass
    );
  };

  getRouter = () => {
    return this.router;
  };  
}
