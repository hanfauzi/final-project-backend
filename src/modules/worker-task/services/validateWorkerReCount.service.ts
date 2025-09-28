import prisma from "../../prisma/prisma.service";
import { AppError } from "../../../utils/app.error";
import { ValidateWorkerReCountDTO } from "../dto/validateWorkerReCount.dto";

export class ValidateWorkerReCountService {
  validateWorkerReCount = async (
    authUser: { id: string; role: string },
    body: ValidateWorkerReCountDTO
  ) => {
    try {
      const allowedRoles = ["WORKER"];
      if (!allowedRoles.includes(authUser.role)) {
        throw new AppError("You are not a worker", 400);
      }

      const workerTask = await prisma.workerTask.findUnique({
        where: { id: body.workerTaskId },
        include: {
          orderHeader: {
            select: {
              id: true,
              OrderItem: {
                select: {
                  orderItemLaundry: {
                    select: {
                      qty: true,
                      laundryItemId: true,
                      laundryItem: { select: { name: true } },
                    },
                  },
                },
              },
            },
          },
        },
      });

      if (!workerTask) {
        throw new AppError("Worker task not found", 404);
      }

      if (!workerTask.orderHeader) {
        throw new AppError("Order header not found for this worker task", 404);
      }

      if (!workerTask.orderHeader.OrderItem) {
        throw new AppError("Order items not found for this order header", 404);
      }

      const dbItems = workerTask.orderHeader.OrderItem.flatMap(
        (oi) => oi.orderItemLaundry
      );

      const mismatches = [];

      for (const inputItem of body.items) {
        const dbItem = dbItems.find(
          (d) => d.laundryItemId === inputItem.laundryItemId
        );

        if (!dbItem) {
          mismatches.push({
            laundryItemId: inputItem.laundryItemId,
            itemName: "Unknown Item",
            expectedQty: 0,
            receivedQty: inputItem.qty,
          });
          continue;
        }

        if (dbItem.qty !== inputItem.qty) {
          mismatches.push({
            laundryItemId: dbItem.laundryItemId,
            itemName: dbItem.laundryItem.name,
            expectedQty: dbItem.qty,
            receivedQty: inputItem.qty,
          });
        }
      }

      if (mismatches.length > 0) {
        const updatedWorkerTask = await prisma.workerTask.update({
          where: { id: body.workerTaskId },
          data: { isBypassRequired: true, isItemValidated: false },
        });

        return {
          message: "Validation failed — bypass required",
          mismatches,
          updatedWorkerTask,
        };
      }

      const updatedWorkerTask = await prisma.workerTask.update({
        where: { id: body.workerTaskId },
        data: { isBypassRequired: false, isItemValidated: true },
      });

      return {
        message: "Validation passed",
        mismatches: [],
        updatedWorkerTask,
      };

    } catch (error) {
      console.error("Validation Error: ", error);
      if (error instanceof AppError) throw error;
      throw new AppError("Failed to validate worker task", 500);
    }
    
  };
}
