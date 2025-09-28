import prisma from "../../prisma/prisma.service";
import { AppError } from "../../../utils/app.error";

export class GetWorkerTaskByIdService {
  getWorkerTaskById = async (
    authUser: { id: string; role: string },
    workerTaskId: string
  ) => {
    try {
      const allowedRoles = ["WORKER"];
      if (!allowedRoles.includes(authUser.role)) {
        throw new AppError("You are not a worker", 400);
      }

      const workerTask = await prisma.workerTask.findFirst({
        where: { id: workerTaskId },
        include: {
          employee: {
            select: {
              name: true,
            }
          },
          orderHeader: {
            select: {
              id: true,
              outlets: {
                select: {
                  id: true,
                  name: true
                }
              },
              OrderItem: {
                select: {
                  orderItemLaundry: {
                    select: {
                      id: true,
                      qty: true,
                      laundryItem: {
                        select: {
                          id: true,
                          name: true,
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        },
      });

      if (!workerTask) {
        throw new AppError("Worker task not found", 404);
      }
      
      return {
        message: "Get worker task success!",
        data: workerTask,
      };

    } catch (error) {
      console.error("Error : ", error);
      if (error instanceof AppError) throw error;
      throw new AppError("Failed to get worker task", 500);
    }
  };
}
