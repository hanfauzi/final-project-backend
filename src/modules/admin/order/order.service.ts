import { $Enums, OrderStatus } from "../../../generated/prisma";
import { AppError } from "../../../utils/app.error";
import { getMeta, getPagination } from "../../../utils/pagination.helper";
import prisma from "../../prisma/prisma.service";
import { GetAllOrdersDto } from "./dto/get-all-orders.dto";

export class OrderAdminService {
  getAllOrders = async (query: GetAllOrdersDto) => {
    const { page, limit, outletId, sortBy, sortOrder } = query;

    const { skip, take } = getPagination(page, limit);

    const [orders, total] = await prisma.$transaction([
      prisma.orderHeader.findMany({
        where: {
          deletedAt: null,
          ...(outletId ? { outletId } : {}),
        },
        include: {
          customers: { select: { id: true, name: true, phoneNumber: true } },
          employees: true,
          outlets: {
            select: { id: true, name: true, address: true, phoneNumber: true },
          },
          OrderItem: {
            include: {
              service: true,
              orderItemLaundry: {
                include: {
                  laundryItem: true,
                },
              },
            },
          },
          Payment: true,
        },
        skip,
        take,
        orderBy: {
          [sortBy]: sortOrder,
        },
      }),
      prisma.orderHeader.count({
        where: {
          deletedAt: null,
          ...(outletId ? { outletId } : {}),
        },
      }),
    ]);

    return { data: orders, meta: getMeta(total, page, limit) };
  };

  getOrderDetailById = async (id: string) => {
    const order = await prisma.orderHeader.findFirst({
      where: { id, deletedAt: null },
      include: {
        customers: { select: { id: true, name: true, phoneNumber: true } },
        employees: true,
        outlets: {
          select: { id: true, name: true, address: true, phoneNumber: true },
        },
        OrderItem: {
          include: {
            service: true,
            orderItemLaundry: {
              include: {
                laundryItem: true,
              },
            },
          },
        },
        workerTasks: { include: {employee: true, workStation: true} },
        Payment: true,
      },
    });
    if (!order) {
      throw new AppError("Order not found", 404);
    }
    const estimatedDoneAt = order.estHours
    ? new Date(order.createdAt.getTime() + order.estHours * 60 * 60 * 1000)
    : null;

    return {...order, estimatedDoneAt};
  };

  getAllOrdersForOutletAdmin = async (
    outletId: string,
    query: GetAllOrdersDto
  ) => {
    const {
      page,
      limit = 2,
      sortBy,
      sortOrder,
      status,
      employeeId,
      startDate,
      endDate,
    } = query;
    const { skip, take } = getPagination(page, limit);

    // Cek apakah ada outlet admin
    const outletAdmin = await prisma.employee.findFirst({
      where: { role: "OUTLET_ADMIN", outletId, deletedAt: null },
    });

    if (!outletAdmin) {
      throw new AppError("Outlet admin access only", 404);
    }

    let statusFilter: OrderStatus | undefined;
    if (status) {
      const normalized = status.trim().toLowerCase();
      const matchedKey = Object.entries(OrderStatus).find(
        ([, value]) => value.toLowerCase() === normalized
      );
      if (!matchedKey) {
        throw new AppError(
          `Invalid status value: ${status}. Must be one of: ${Object.values(OrderStatus).join(", ")}`,
          400
        );
      }
      statusFilter = matchedKey[1] as OrderStatus;
    }

    const whereClause: any = {
      outletId,
      ...(statusFilter ? { status: statusFilter } : {}),
      ...(employeeId ? { employeeId } : {}),
      ...(startDate && endDate
        ? { createdAt: { gte: new Date(startDate), lte: new Date(endDate) } }
        : {}),
    };

    const [orders, total] = await prisma.$transaction([
      prisma.orderHeader.findMany({
        where: whereClause,
        skip,
        take,
        orderBy: { [sortBy || "createdAt"]: sortOrder || "desc" },
        include: {
          customers: { select: { id: true, name: true, phoneNumber: true } },
          employees: { select: { id: true, name: true, role: true } },
          outlets: {
            select: { id: true, name: true, address: true, phoneNumber: true },
          },
          OrderItem: true,
          pickUpOrder: true,
          Payment: { select: { id: true, amount: true, status: true } },
          workerTasks: {
            include: {employee: true, workStation: true}
          }
        },
      }),
      prisma.orderHeader.count({ where: { outletId } }),
    ]);

    // Hitung totalPrice tiap order
    const formattedOrders = orders.map((order) => {
      const itemsTotal = order.OrderItem.reduce(
        (sum, item) => sum + item.subTotal,
        0
      );
      const pickupPrice = order.pickUpOrder?.price ?? 0;
      const totalPrice = itemsTotal + pickupPrice;

      return {
        ...order,
        totalPrice,
      };
    });

    return { data: formattedOrders, meta: getMeta(total, page, limit) };
  };
}
