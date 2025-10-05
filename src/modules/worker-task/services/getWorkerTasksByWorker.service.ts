import prisma from "../../prisma/prisma.service";
import { AppError } from "../../../utils/app.error";
import { Prisma } from "../../../generated/prisma";
import { GetWorkerTasksDTO } from "../dto/getWorkerTasks.dto";

type WorkerTaskMode = "HISTORY" | "AVAILABLE_TASK";

function toLocalStart(dateStr: string) {
  const d = new Date(dateStr);
  d.setHours(0, 0, 0, 0);
  return d;
}

function toLocalEnd(dateStr: string) {
  const d = new Date(dateStr);
  d.setHours(23, 59, 59, 999);
  return d;
}

export class GetWorkerTasksByWorkerService {
  getWorkerTasksByWorker = async (
    authUser: { id: string; role: string },
    query: GetWorkerTasksDTO,
    mode: WorkerTaskMode
  ) => {
    try {
      const worker = await prisma.employee.findUnique({
        where: { id: authUser.id },
        include: {
          WorkStation: {
            select: {
              station: true,
            }
          }
        }
      });
      if (!worker) {
        throw new AppError("Worker not found", 404);
      }

      const { take, page, sortBy, sortOrder, fromDate, toDate, yearMonth, } = query;
      const whereClause: Prisma.workerTaskWhereInput = {};

      if (mode === "HISTORY") {
        whereClause.employeeId = authUser.id;
      } else if (mode === "AVAILABLE_TASK") {
        whereClause.employee = null;
      }

      if (yearMonth) {
        const [year, month] = yearMonth.split("-").map(Number);

        const start = new Date(year, month - 1, 1, 0, 0, 0, 0);

        const lastDay = new Date(year, month, 0).getDate();
        const end = new Date(year, month - 1, lastDay, 23, 59, 59, 999);

        whereClause.createdAt = { gte: start, lte: end };
      } else if (fromDate || toDate) {
        whereClause.createdAt = {};
        if (fromDate) {
          whereClause.createdAt.gte = toLocalStart(fromDate);
        }
        if (toDate) {
          whereClause.createdAt.lte = toLocalEnd(toDate);
        }
      }

      if (worker.WorkStation.length > 0) {
        const stations = worker.WorkStation.map(ws => ws.station);
        whereClause.station = { in: stations };
      } else {
        whereClause.station = { in: [] };
      }

      if (worker.outletId) {
        whereClause.outletId = worker.outletId;
      } else {
        whereClause.outletId = { in: [] };
      }

      const workerTasks = await prisma.workerTask.findMany({
        where: whereClause,
        orderBy: { [sortBy]: sortOrder},
        skip: (page - 1) * take,
        take: take,
        include: {
          orderHeader: {
            select: {
              OrderItem: {
                select: {
                  qty: true,
                  service: {
                    select: {
                      name: true,
                      unit: true,
                    }
                  }
                }
              }
            }
          }
        }
      });

      const total = await prisma.workerTask.count({
        where: whereClause,
      });

      return {
        message: "Get worker tasks success!",
        data: workerTasks,
        meta: { page, take, total },
      };
    } catch (error) {
      console.error("Error : ", error);
      if (error instanceof AppError) throw error;
      throw new AppError("Failed to get worker tasks", 500);
    }
  };
}