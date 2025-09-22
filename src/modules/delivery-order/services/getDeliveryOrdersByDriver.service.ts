import prisma from "../../prisma/prisma.service";
import { AppError } from "../../../utils/app.error";
import { Prisma } from "../../../generated/prisma";
import { GetDeliveryOrdersByDriverDTO } from "../dto/getDeliveryOrdersByDriver.dto";

export class GetDeliveryOrdersByDriverService {
  getDeliveryOrdersByDriver = async (
    authUser: { id: string; role: string },
    query: GetDeliveryOrdersByDriverDTO
  ) => {
    try {

      const allowedRoles = ["DRIVER"];
      if (!allowedRoles.includes(authUser.role)) {
        throw new AppError("You are not a driver", 400);
      }

      const { take, page, sortBy, sortOrder, fromDate, toDate, yearMonth } = query;
      const whereClause: Prisma.DeliveryOrderWhereInput = { driverId: authUser.id, };

      if (yearMonth) {
        const [year, month] = yearMonth.split("-").map(Number);
        const start = new Date(Date.UTC(year, month - 1, 1, 0, 0, 0, 0));
        const end = new Date(Date.UTC(year, month, 0, 23, 59, 59, 999));

        whereClause.createdAt = { gte: start, lte: end };
      } else if (fromDate || toDate) {
        whereClause.createdAt = {};
        if (fromDate) {
          whereClause.createdAt.gte = new Date(fromDate);
        }
        if (toDate) {
          const end = new Date(toDate);
          end.setUTCHours(23, 59, 59, 999);
          whereClause.createdAt.lte = end;
        }
      }

      const deliveryOrder = await prisma.deliveryOrder.findMany({
        where: whereClause,
        orderBy: { [sortBy]: sortOrder},
        skip: (page - 1) * take,
        take: take,
        include: {
          orderHeader: {
            select: {
              id: true,
              customers: {
                select: {
                  name: true
                }
              }
            }
          }
        }
      });

      const total = await prisma.deliveryOrder.count({
        where: whereClause,
      });

      return {
        message: "Get delivery order success!",
        data: deliveryOrder,
        meta: { page, take, total },
      };
    } catch (error) {
      console.error("Error : ", error);
      if (error instanceof AppError) throw error;
      throw new AppError("Failed to get delivery order", 500);
    }
  };
}