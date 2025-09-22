import prisma from "../../prisma/prisma.service";
import { AppError } from "../../../utils/app.error";

export class GetDeliveryOrderByIdService {
  getDeliveryOrderById = async (
    authUser: { id: string; role: string },
    deliveryOrderId: string
  ) => {
    try {
      const allowedRoles = ["DRIVER"];
      if (!allowedRoles.includes(authUser.role)) {
        throw new AppError("You are not a driver", 400);
      }

      const deliveryOrder = await prisma.deliveryOrder.findFirst({
        where: { id: deliveryOrderId },
        include: {
          outlet: {
            select: {
              address: true,
              latitude: true,
              longitude: true,
            },
          },
          customerAddress: {
            select: {
              address: true,
              phoneNumber: true,
              latitude: true,
              longitude: true,
            },
          },
          assignedByAdmin: {
            select: {
              name: true,
            }
          },
          orderHeader: {
            select: {
              id: true,
              customers: {
                select: {
                  name: true,
                }
              }
            }
          }
        },
      });

      if (!deliveryOrder) {
        throw new AppError("Delivery order not found", 404);
      }
      
      return {
        message: "Get delivery order success!",
        data: deliveryOrder,
      };

    } catch (error) {
      console.error("Error : ", error);
      if (error instanceof AppError) throw error;
      throw new AppError("Failed to get delivery order", 500);
    }
  };
}
