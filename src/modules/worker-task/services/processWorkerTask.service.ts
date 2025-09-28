import prisma from "../../prisma/prisma.service";
import { AppError } from "../../../utils/app.error";
import { DeliveryStatus, Station } from "../../../generated/prisma";

export class ProcessWorkerTaskService {
  processWorkerTask = async (
    authUser: { id: string; role: string }, 
    workerTaskId: string
  ) => {
    try {
      const allowedRoles = ["WORKER"]
      if (!allowedRoles.includes(authUser.role)) {
        throw new AppError("You are not a worker", 400);
      }

      const result = await prisma.$transaction(async (tx) => {
        const worker = await tx.employee.findUnique({
          where: { id: authUser.id }
        })
        if (!worker) {
          throw new AppError("Worker not found", 404)
        };
        if (worker.takenTaskId && worker.takenTaskId !== workerTaskId) {
          throw new AppError("You already have another active task", 400);
        }

        const workerTask = await tx.workerTask.findUnique({
          where: { id: workerTaskId},
          include: {
            orderHeader: {
              select: {
                id: true,
                status: true,
                pickUpOrder: {
                  select: {
                    customerAddressId: true,
                    price: true,
                    distance: true,
                  }
                }
              }
            }
          }
        })
        if(!workerTask) {
          throw new AppError("Worker task not found", 404);
        }
        if (!workerTask.outletId) {
          throw new AppError("Outlet  missing for delivery order", 400);
        }
        if (!workerTask.orderHeader?.pickUpOrder?.customerAddressId) {
          throw new AppError("Customer address missing for delivery order", 400);
        }
        
        let workerTaskStatus = workerTask.status;
        let workerTaskEmployeeId = workerTask.employeeId;
        let updatedOrderHeaderStatus = workerTask.orderHeader?.status;

        if (workerTask.employeeId === null && workerTask.status === "PENDING") {
          workerTaskEmployeeId = authUser.id;
          workerTaskStatus = "ASSIGNED";
        } else if (workerTask.status === "ASSIGNED") {
          if (workerTask.isItemValidated === true || workerTask.isReqAprooved === true) {
            workerTaskStatus = "IN_PROGRESS";
            if (workerTask.station === Station.WASHING) {
              updatedOrderHeaderStatus = "WASHING_IN_PROGRESS";
            } else if (workerTask.station === Station.IRONING) {
              updatedOrderHeaderStatus = "IRONING_IN_PROGRESS";
            } else if (workerTask.station === Station.PACKING) {
              updatedOrderHeaderStatus = "PACKING_IN_PROGRESS";
            }
          } else {
            throw new AppError("Item must be validated before processing", 400);
          }
        } else if (workerTask.status === "IN_PROGRESS") {
          workerTaskStatus = "DONE";
        } else if (workerTask.status === "DONE") {
          throw new AppError("This task is already completed", 400);
        } else {
          throw new AppError("Forbidden: You cannot process this task", 400);
        }

        let workerUpdateData: any = {};
        if (!worker.takenTaskId) {
          let workerTaskType = workerTask.station;
          workerUpdateData = {
            takenTaskId: workerTaskId,
            takenTaskType: workerTaskType,
          };
        } else if (workerTaskStatus === "DONE") {
          workerUpdateData = {
            takenTaskId: null,
            takenTaskType: null,
          };
        }

        const updatedWorkerTask = await tx.workerTask.update({
          where: { id: workerTaskId },
          data: { 
            employeeId: workerTaskEmployeeId,
            status: workerTaskStatus, 
          },
        });

        const updatedOrderHeader = await tx.orderHeader.update({
          where: { id: workerTask.orderHeaderId },
          data: { status: updatedOrderHeaderStatus },
        })

        const updatedWorker = await tx.employee.update({
          where: { id: authUser.id },
          data: workerUpdateData,
          omit: { password: true, resetPasswordToken: true },
        });

        let nextWorkerTask = null;
        let newDeliveryOrder = null;

        if (workerTaskStatus === "DONE") {
          const stationFlow: Record<Station, Station | null> = {
            [Station.WASHING]: Station.IRONING,
            [Station.IRONING]: Station.PACKING,
            [Station.PACKING]: null,
            [Station.QA]: null,
            [Station.ADMIN]: null,
          };

          const nextStation = stationFlow[workerTask.station];

          if (nextStation) {
            nextWorkerTask = await tx.workerTask.findFirst({
              where: {
                orderHeaderId: workerTask.orderHeaderId,
                station: nextStation,
              },
            });

            if (!nextWorkerTask) {
              nextWorkerTask = await tx.workerTask.create({
                data: {
                  orderHeaderId: workerTask.orderHeaderId,
                  outletId: workerTask.outletId,
                  station: nextStation,
                  status: "PENDING",
                  employeeId: null,
                  isItemValidated: false,
                },
              });
            }
          } else {
            await tx.orderHeader.update({
              where: { id: workerTask.orderHeaderId },
              data: { status: "WAITING_FOR_PAYMENT" },
            });

            newDeliveryOrder = await tx.deliveryOrder.create({
              data: {
                orderHeaderId: workerTask.orderHeaderId,
                outletId: workerTask.outletId,
                customerAddressId: workerTask.orderHeader?.pickUpOrder?.customerAddressId,
                status: DeliveryStatus.NOT_READY_TO_DELIVER,
                distance: workerTask.orderHeader?.pickUpOrder?.distance,
                price: workerTask.orderHeader?.pickUpOrder?.price,
              },
            })
          }
          
        }

        return { updatedWorker, updatedWorkerTask, updatedOrderHeader, nextWorkerTask, newDeliveryOrder };
      });
      
      return { message: "Worker task processed successfully!", data: result };

    } catch (error) {
      console.error("Error : ", error);
      if (error instanceof AppError) throw error;
      throw new AppError("Failed to process worker task", 500);
    }
  }
}