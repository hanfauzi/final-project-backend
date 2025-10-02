import prisma from "../../prisma/prisma.service";
import { AppError } from "../../../utils/app.error";
import { OrderStatus } from "../../../generated/prisma";

export class ProcessDeliveryOrderService {
  processDeliveryOrder = async (
    authUser: { id: string; role: string }, 
    deliveryOrderId: string
  ) => {
    try {
      const allowedRoles = ["DRIVER"]
      if (!allowedRoles.includes(authUser.role)) {
        throw new AppError("You are not a driver", 400);
      }

      const result = await prisma.$transaction(async (tx) => {
        const driver = await tx.employee.findUnique({
          where: { id: authUser.id }
        })
        if (!driver) {
          throw new AppError("Driver not found", 404)
        };
        if (driver.takenTaskId && driver.takenTaskId !== deliveryOrderId) {
          throw new AppError("You already have another active task", 400);
        }

        const deliveryOrder = await tx.deliveryOrder.findUnique({
          where: { id: deliveryOrderId},
          include: {
            orderHeader: {
              select: {
                id: true,
                status: true,
              }
            }
          }
        })
        if(!deliveryOrder) {
          throw new AppError("Delivery order not found", 404);
        }
        if (deliveryOrder.driverId && deliveryOrder.driverId !== authUser.id) {
          throw new AppError("This pick-up order is already assigned to another driver", 403);
        }
        
        let deliveryOrderStatus = deliveryOrder.status;
        let updatedTakenByDriverAt = deliveryOrder.takenByDriverAt;
        let updatedDeliveredtAt = deliveryOrder.deliveredAt;
        let updatedOrderHeaderStatus = deliveryOrder.orderHeader.status;

        if (deliveryOrder.status === "NOT_READY_TO_DELIVER") {
          throw new AppError("This task is not ready to deliver", 400);
        } else if (deliveryOrder.status === "WAITING_FOR_DRIVER"){
          deliveryOrderStatus = "ON_THE_WAY_TO_OUTLET";
        } else if (deliveryOrder.status === "ON_THE_WAY_TO_OUTLET") {
          deliveryOrderStatus = "ON_THE_WAY_TO_CUSTOMER";
          updatedTakenByDriverAt = new Date();
          updatedOrderHeaderStatus = "OUT_FOR_DELIVERY"
        } else if (deliveryOrder.status === "ON_THE_WAY_TO_CUSTOMER") {
          deliveryOrderStatus = "RECEIVED_BY_CUSTOMER";
          updatedDeliveredtAt = new Date();
          updatedOrderHeaderStatus = "DELIVERED_TO_CUSTOMER"
        }  else if (deliveryOrder.status === "RECEIVED_BY_CUSTOMER") {
          throw new AppError("This task is already completed", 400);
        } else {
          throw new AppError("Forbidden: You cannot process this task", 400);
        }

        let driverUpdateData: any = {};
        if (!driver.takenTaskId) {
          driverUpdateData = {
            takenTaskId: deliveryOrderId,
            takenTaskType: "DELIVERY",
          };
        } else if (deliveryOrderStatus === "RECEIVED_BY_CUSTOMER") {
          driverUpdateData = {
            takenTaskId: null,
            takenTaskType: null,
          };
        }

        const updatedDeliveryOrder = await tx.deliveryOrder.update({
          where: { id: deliveryOrderId },
          data: { 
            status: deliveryOrderStatus, 
            takenByDriverAt: updatedTakenByDriverAt,
            deliveredAt: updatedDeliveredtAt,
            driverId: deliveryOrder.driverId ?? authUser.id,
          },
        });

        const updatedOrderHeader = await tx.orderHeader.update({
          where: {id: deliveryOrder.orderHeader.id},
          data: { status: updatedOrderHeaderStatus as OrderStatus },
        })

        const updatedDriver = await tx.employee.update({
          where: { id: authUser.id },
          data: driverUpdateData,
          omit: { password: true, resetPasswordToken: true },
        });

        return { updatedDriver, updatedDeliveryOrder, updatedOrderHeader };
      });
      
      return { message: "Delivery order processed successfully!", data: result };

    } catch (error) {
      console.error("Error : ", error);
      if (error instanceof AppError) throw error;
      throw new AppError("Failed to process delivery order", 500);
    }
  }
}