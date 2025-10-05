import prisma from "../../prisma/prisma.service";
import { AppError } from "../../../utils/app.error";

export class ProcessPickUpOrderService {
  processPickUpOrder = async (
    authUser: { id: string; role: string },
    pickUpOrderId: string
  ) => {
    try {
      const result = await prisma.$transaction(
        async (tx) => {
          const driver = await tx.employee.findUnique({
            where: { id: authUser.id },
          });
          if (!driver) {
            throw new AppError("Driver not found", 404);
          }
          if (driver.takenTaskId && driver.takenTaskId !== pickUpOrderId) {
            throw new AppError("You already have another active task", 400);
          }

          const pickUpOrder = await tx.pickUpOrder.findUnique({
            where: { id: pickUpOrderId },
          });
          if (!pickUpOrder) {
            throw new AppError("Pick-up order not found", 404);
          }
          if (pickUpOrder.driverId && pickUpOrder.driverId !== authUser.id) {
            throw new AppError(
              "This pick-up order is already assigned to another driver",
              403
            );
          }

          let pickUpOrderStatus = pickUpOrder.status;
          let updatedAssignByDriverAt = pickUpOrder.assignByDriverAt;
          let updatedPickUpAt = pickUpOrder.pickedUpAt;
          let updatedArivedAtOutletAt = pickUpOrder.arrivedAtOutlet;

          if (pickUpOrder.status === "WAITING_FOR_DRIVER") {
            pickUpOrderStatus = "ON_THE_WAY_TO_CUSTOMER";
            updatedAssignByDriverAt = new Date();
          } else if (pickUpOrder.status === "ON_THE_WAY_TO_CUSTOMER") {
            pickUpOrderStatus = "ON_THE_WAY_TO_OUTLET";
            updatedPickUpAt = new Date();
          } else if (pickUpOrder.status === "ON_THE_WAY_TO_OUTLET") {
            pickUpOrderStatus = "RECEIVED_BY_OUTLET";
            updatedArivedAtOutletAt = new Date();
          } else if (pickUpOrder.status === "RECEIVED_BY_OUTLET") {
            throw new AppError("This task is already completed", 400);
          } else {
            throw new AppError("Forbidden: You cannot process this task", 400);
          }

          let driverUpdateData: any = {};
          if (!driver.takenTaskId) {
            driverUpdateData = {
              takenTaskId: pickUpOrderId,
              takenTaskType: "PICKUP",
            };
          } else if (pickUpOrderStatus === "RECEIVED_BY_OUTLET") {
            driverUpdateData = {
              takenTaskId: null,
              takenTaskType: null,
            };
          }

          const updatedPickUpOrder = await tx.pickUpOrder.update({
            where: { id: pickUpOrderId },
            data: {
              status: pickUpOrderStatus,
              assignByDriverAt: updatedAssignByDriverAt,
              pickedUpAt: updatedPickUpAt,
              arrivedAtOutlet: updatedArivedAtOutletAt,
              driverId: pickUpOrder.driverId ?? authUser.id,
            },
          });

          const updatedDriver = await tx.employee.update({
            where: { id: authUser.id },
            data: driverUpdateData,
            omit: { password: true, resetPasswordToken: true },
          });

          return { updatedDriver, updatedPickUpOrder };
        },
        {
          maxWait: 7_000,
          timeout: 15_000,
          isolationLevel: "ReadCommitted" as any,
        }
      );

      return { message: "Pick-up order processed successfully!", data: result };
    } catch (error) {
      console.error("Error : ", error);
      if (error instanceof AppError) throw error;
      throw new AppError("Failed to process pick-up order", 500);
    }
  };
}
