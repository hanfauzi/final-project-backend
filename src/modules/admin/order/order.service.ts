import { AppError } from "../../../utils/app.error";
import { getMeta, getPagination } from "../../../utils/pagination.helper";
import prisma from "../../prisma/prisma.service";
import { AddOrderItemsDto } from "./dto/create-order-items.dto";
import { GetAllOrdersDto } from "./dto/get-all-orders.dto";
import { CreateOrderItem } from "./types/order-items-response.type";

export class OrderAdminService {
  getAllOrders = async (query: GetAllOrdersDto) => {
    const { page, limit, outletId, sortBy, sortOrder } = query;

    const superAdmin = await prisma.employee.findFirst({
      where: { role: "SUPER_ADMIN", deletedAt: null },
    });

    if (!superAdmin) {
      throw new AppError("Super admin access only", 404);
    }

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
        Payment: true,
      },
    });

    if (!order) {
      throw new AppError("Order not found", 404);
    }

    return order;
  };

  getAllOrdersForOutletAdmin = async (
    outletId: string,
    query: GetAllOrdersDto
  ) => {
    const { page, limit, sortBy, sortOrder } = query;
    const { skip, take } = getPagination(page, limit);

    const outletAdmin = await prisma.employee.findFirst({
      where: { role: "OUTLET_ADMIN", outletId, deletedAt: null },
    });

    if (!outletAdmin) {
      throw new AppError("Outlet admin access only", 404);
    }

    const [orders, total] = await prisma.$transaction([
      prisma.orderHeader.findMany({
        where: { outletId },
        skip,
        take,
        orderBy: { [sortBy]: sortOrder },
        include: {
          customers: { select: { id: true, name: true, phoneNumber: true } },
          employees: { select: { id: true, name: true, role: true } },
          outlets: {
            select: { id: true, name: true, address: true, phoneNumber: true },
          },
          OrderItem: true,
          Payment: { select: { id: true, amount: true, status: true } },
        },
      }),
      prisma.orderHeader.count({ where: { outletId } }),
    ]);

    return { data: orders, meta: getMeta(total, page, limit) };
  };
}
