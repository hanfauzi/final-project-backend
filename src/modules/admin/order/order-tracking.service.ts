import { OrderStatus } from "../../../generated/prisma";
import { getMeta, getPagination } from "../../../utils/pagination.helper";
import prisma from "../../prisma/prisma.service";

export class OrderTrackingService {
  getOrdersTracking = async (filters: {
    outletId: string;
    status?: OrderStatus;
    employeeId?: string;
    dateFrom?: Date;
    dateTo?: Date;
    page: number;
    limit: number;
  }) => {
    const { skip, take } = getPagination(filters.page, filters.limit);

    const whereCondition = {
      outletId: filters.outletId,
      status: filters.status,
      createdAt:
        filters.dateFrom && filters.dateTo
          ? {
              gte: filters.dateFrom,
              lte: filters.dateTo,
            }
          : undefined,
      workerTasks: filters.employeeId
        ? {
            some: {
              employeeId: filters.employeeId,
            },
          }
        : undefined,
    };

    const total = await prisma.orderHeader.count({
      where: {
        ...whereCondition,
        deletedAt: null,
      },
    });

    const orders = await prisma.orderHeader.findMany({
      where: whereCondition,
      skip,
      take,
      include: {
        workerTasks: { include: { employee: true, workStation: true } },
        customers: { select: { id: true, name: true, phoneNumber: true } },
        OrderItem: {
          include: {
            orderItemLaundry: { include: { laundryItem: true } },
            service: true,
          },
        },
      },
    });

    return { data: orders, meta: getMeta(total, filters.page, filters.limit) };
  };
}
