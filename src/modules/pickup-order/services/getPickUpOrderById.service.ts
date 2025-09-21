import prisma from "../../prisma/prisma.service";
import { AppError } from "../../../utils/app.error";

export class GetPickUpOrderByIdService {
  getPickUpOrderById = async (
    authUser: { id: string; role: string },
    pickUpOrderId: string
  ) => {
    const allowedRoles = ["DRIVER"];
    if (!allowedRoles.includes(authUser.role)) {
      throw new AppError("You are not a driver", 400);
    }

    const pickUpOrder = await prisma.pickUpOrder.findFirst({
      where: { id: pickUpOrderId },
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
        customer: {
          select: {
            name: true,
          }
        },
        assignedByAdmin: {
          select: {
            name: true,
          }
        }
      },
    });

    if (!pickUpOrder) {
      throw new AppError("Pick-up order not found", 404);
    }
    
    return {
      message: "Get pick-up order success!",
      data: pickUpOrder,
    };
  };
}
