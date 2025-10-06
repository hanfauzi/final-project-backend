import prisma from "../../prisma/prisma.service";
import { AppError } from "../../../utils/app.error";
import { ReqWorkerTaskBypassDTO } from "../dto/reqWorkerTaskBypass.dto";

export class ReqWorkerTaskBypasskService {
  reqWorkerTaskBypass = async (
    authUser: { id: string; role: string }, 
    workerTaskId: string,
    body: ReqWorkerTaskBypassDTO,
  ) => {
    try {
      const workerTask = await prisma.workerTask.findUnique({
        where: { id: workerTaskId }
      })
      if(!workerTask) {
        throw new AppError("Worker task not found", 404);
      }
      if(!workerTask.isBypassRequired) {
        throw new AppError("This task does not require bypass", 400);
      }

      const result = await prisma.workerTask.update({
        where: { id: workerTaskId },
        data: {
          bypassReq: true,
          isReqAprooved: null,
          bypassReqNote: body.bypassReqNote
        }
      })
      
      return { message: "Worker task processed successfully!", data: result };

    } catch (error) {
      console.error("Error : ", error);
      if (error instanceof AppError) throw error;
      throw new AppError("Failed to process worker task", 500);
    }
  }
}