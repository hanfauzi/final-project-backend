import prisma from "../../prisma/prisma.service";
import { AppError } from "../../../utils/app.error";
import { PickupStatus, Prisma } from "../../../generated/prisma";
import { GetPickUpOrdersByDriverDTO } from "../dto/getPickUpOrdersByDriver.dto";

type PickUpOrderMode = "HISTORY" | "AVAILABLE_TASK";

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
export class GetPickUpOrdersByDriverService {
  getPickUpOrdersByDriver = async (
    authUser: { id: string; role: string },
    query: GetPickUpOrdersByDriverDTO,
    mode: PickUpOrderMode,
  ) => {
    try {
      const allowedRoles = ["DRIVER"];
      if (!allowedRoles.includes(authUser.role)) {
        throw new AppError("You are not a driver", 400);
      }

      const driver = await prisma.employee.findUnique({
        where: { id: authUser.id },
      });
      if (!driver) {
        throw new AppError("Driver not found", 404);
      }

      const { take, page, sortBy, sortOrder, fromDate, toDate, yearMonth,  } = query;
      const whereClause: Prisma.PickUpOrderWhereInput = {};

      if (mode === "HISTORY") {
        whereClause.driverId = authUser.id;
      } else if (mode === "AVAILABLE_TASK") {
        whereClause.driver = null;
        whereClause.status = PickupStatus.WAITING_FOR_DRIVER;
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

      if (driver.outletId) {
        whereClause.outletId = driver.outletId;
      } else {
        whereClause.outletId = { in: [] };
      }
    
      const pickUpOrder = await prisma.pickUpOrder.findMany({
        where: whereClause,
        orderBy: { [sortBy]: sortOrder},
        skip: (page - 1) * take,
        take: take,
        include: {
          customerAddress: {
            select: {
              address: true,
            }
          }
        }
      });

      const total = await prisma.pickUpOrder.count({
        where: whereClause,
      });

      return {
        message: "Get pick-up order success!",
        data: pickUpOrder,
        meta: { page, take, total },
      };
      
    } catch (error) {
      console.error("Error : ", error);
      if (error instanceof AppError) throw error;
      throw new AppError("Failed to get pick-up order", 500);
    }
  };
}
