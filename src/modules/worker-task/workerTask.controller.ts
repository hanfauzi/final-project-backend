import { Request, Response } from "express";
import { plainToInstance } from "class-transformer";
import { GetWorkerTasksByWorkerService } from "./services/getWorkerTasksByWorker.service";
import { GetWorkerTasksDTO } from "./dto/getWorkerTasks.dto";
import { GetWorkerTaskByIdService } from "./services/getWorkerTaskById.service";
import { ValidateWorkerReCountService } from "./services/validateWorkerReCount.service";
import { ValidateWorkerReCountDTO } from "./dto/validateWorkerReCount.dto";
import { ProcessWorkerTaskService } from "./services/processWorkerTask.service";
import { ReqWorkerTaskBypasskService } from "./services/reqWorkerTaskBypass.service";

export class WorkerTaskController {
  private getWorkerTasksByWorkerService: GetWorkerTasksByWorkerService;
  private getWorkerTaskByIdService: GetWorkerTaskByIdService;
  private validateWorkerReCountService: ValidateWorkerReCountService;
  private processWorkerTaskService: ProcessWorkerTaskService;
  private reqWorkerTaskBypassService: ReqWorkerTaskBypasskService;

  constructor() {
    this.getWorkerTasksByWorkerService = new GetWorkerTasksByWorkerService();
    this.getWorkerTaskByIdService = new GetWorkerTaskByIdService();
    this.validateWorkerReCountService = new ValidateWorkerReCountService();
    this.processWorkerTaskService = new ProcessWorkerTaskService();
    this.reqWorkerTaskBypassService = new ReqWorkerTaskBypasskService();
  }

  getWorkerTasksByWorker = async (req: Request, res: Response) => {
    const authUser = res.locals.payload;
    const query = plainToInstance(GetWorkerTasksDTO, req.query);
    const mode = query.mode ?? "AVAILABLE_TASK";
    const result = await this.getWorkerTasksByWorkerService.getWorkerTasksByWorker(authUser, query, mode);
    res.status(200).json(result);
  };

  getWorkerTaskById = async (req: Request, res: Response) => {
    const authUser = res.locals.payload;
    const { id:workerTaskId } = req.params;
    const result = await this.getWorkerTaskByIdService.getWorkerTaskById(authUser, workerTaskId);
    res.status(200).json(result);
  };

  validateWorkerReCount = async (req: Request, res: Response) => {
    const authUser = res.locals.payload;
    const body = plainToInstance(ValidateWorkerReCountDTO, req.body);
    const result = await this.validateWorkerReCountService.validateWorkerReCount(authUser, body);
    res.status(200).json(result);
  };

  processWorkerTask = async (req: Request, res: Response) => {
    const authUser = res.locals.payload;
    const { id: workerTaskId } = req.params;
    const result = await this.processWorkerTaskService.processWorkerTask(authUser, workerTaskId);
    res.status(200).json(result);
  };

  reqWorkerTaskBypass = async (req: Request, res: Response) => {
    const authUser = res.locals.payload;
    const { id: workerTaskId } = req.params;
    const result = await this.reqWorkerTaskBypassService.reqWorkerTaskBypass(authUser, workerTaskId, req.body);
    res.status(200).json(result);
  };
}
