import { OutletService } from "./outlet/outlet.service";
import prisma from "../prisma/prisma.service";
import { PickUpOrderDTO } from "./dto/pickup-order.dto";
import { AppError } from "../../utils/app.error";
import { OrderStatus, PickupStatus, Prisma } from "../../generated/prisma";
import { CustomerOrderQueryParams, CustomerPickupQueryParams } from "../pagination/pagination.dto";

export class OrderService {
  private outletService: OutletService;
  constructor() {
    this.outletService = new OutletService();
  }

  suggestPickUpOutlet = async ({
    customerId,
    customerAddressId,
  }: {
    customerId: string;
    customerAddressId: string;
  }) => {
    const chosen = await this.outletService.pickOutletForAddress({
      customerId,
      customerAddressId,
    });

    return {
      message: "Suggested outlet",
      data: {
        outletId: chosen.id,
        outletName: chosen.name,
        distanceOutletKm: Math.round(chosen.distanceKm),
      },
    };
  };

  createPickUpOrderRequest = async ({
    customerId,
    customerAddressId,
    notes,
  }: PickUpOrderDTO & { customerId: string }) => {
    return prisma.$transaction(async (tx) => {
      const chosen = await this.outletService.pickOutletForAddress({
        customerId,
        customerAddressId,
      });

      const distanceKm = Math.min(Math.round(chosen.distanceKm), 5);
      const pickupPrice = distanceKm * 3000;

      const pickUpOrder = await tx.pickUpOrder.create({
        data: {
          customerId,
          outletId: chosen.id,
          customerAddressId,
          notes,
          distance: distanceKm,
          price: pickupPrice,
          status: "WAITING_FOR_DRIVER",
        },
        select: {
          id: true,
          outletId: true,
          notes: true,
          distance: true,
          price: true,
          createdAt: true,
          status: true,
        },
      });

      return {
        message: "Pick up order created",
        data: pickUpOrder,
      };
    });
  };

  cancelPickUpOrderRequest = async (
    customerId: string,
    pickUpOrderId: string
  ) => {
    const pickUpOrder = await prisma.pickUpOrder.findFirst({
      where: { id: pickUpOrderId, customerId },
      include: { orderHeaders: true },
    });
    if (!pickUpOrder) throw new AppError("Pick up order not found");

    if (pickUpOrder.status !== "WAITING_FOR_DRIVER") {
      throw new AppError(
        "Only pick up orders with status 'WAITING_FOR_DRIVER' can be cancelled",
        400
      );
    }

    await prisma.pickUpOrder.update({
      where: { id: pickUpOrderId },
      data: { status: "CANCELLED" },
    });

    return { message: "Pick up order cancelled" };
  };

  getCustomerPickUpOrders = async (
    customerId: string,
    query: CustomerPickupQueryParams 
  ) => {
    const { page = 1, take = 5, status, dateFrom, dateTo } = query;

    const where: Prisma.PickUpOrderWhereInput = {
      customerId,
      deletedAt: null,
    };

    const isPickupStatus = (s: string): s is PickupStatus =>
      Object.values(PickupStatus).includes(s as PickupStatus);
    if (status && isPickupStatus(status)) where.status = status;

    if (dateFrom || dateTo) {
      const start = dateFrom
        ? new Date(`${dateFrom}T00:00:00.000Z`)
        : undefined;
      const endExclusive = dateTo
        ? new Date(
            new Date(`${dateTo}T00:00:00.000Z`).getTime() + 24 * 60 * 60 * 1000
          )
        : undefined;

      where.createdAt = {
        ...(start && { gte: start }),
        ...(endExclusive && { lt: endExclusive }),
      };
    }

    const [pickUpOrders, total] = await prisma.$transaction([
      prisma.pickUpOrder.findMany({
        where,
        skip: (page - 1) * take,
        take,
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          outletId: true,
          outlet: { select: { id: true, name: true, cityName: true } },
          customerAddressId: true,
          notes: true,
          distance: true,
          price: true,
          status: true,
          createdAt: true,
          updatedAt: true,
          orderHeaders: {
            select: {
              id: true,
              invoiceNo: true,
              status: true,
              createdAt: true,
            },
            orderBy: { createdAt: "asc" },
            take: 3,
          },
          _count: { select: { orderHeaders: true } },
        },
      }),
      prisma.pickUpOrder.count({ where }),
    ]);

    return {
      data: pickUpOrders,
      meta: {
        page,
        take,
        total,
        totalPages: Math.max(Math.ceil(total / take), 1),
      },
    };
  };

  getCustomerPickUpOrderById = async (customerId: string, id: string) => {
    const pickup = await prisma.pickUpOrder.findFirst({
      where: { id, customerId, deletedAt: null },
      select: {
        id: true,
        status: true,
        notes: true,
        distance: true,
        price: true,
        scheduledAt: true,
        pickedUpAt: true,
        arrivedAtOutlet: true,
        createdAt: true,
        updatedAt: true,
        outlet: {
          select: { id: true, name: true, cityName: true, address: true },
        },
        driver: { select: { id: true, name: true, phoneNumber: true } },
      },
    });

    if (!pickup) throw new AppError("Pick up order not found", 404);
    return pickup;
  };

  getCustomerOrders = async (
    customerId: string,
    query: CustomerOrderQueryParams
  ) => {
    const { page = 1, take = 5, status, invoiceNo, dateFrom, dateTo } = query;

    const where: Prisma.OrderHeaderWhereInput = {
      customerId,
      deletedAt: null,
    };

    if (status) where.status = status;

    if (invoiceNo) {
      where.invoiceNo = { contains: invoiceNo, mode: "insensitive" };
    }

    if (dateFrom || dateTo) {
      const start = dateFrom
        ? new Date(`${dateFrom}T00:00:00.000Z`)
        : undefined;
      const endExclusive = dateTo
        ? new Date(
            new Date(`${dateTo}T00:00:00.000Z`).getTime() + 24 * 60 * 60 * 1000
          )
        : undefined;

      where.createdAt = {
        ...(start && { gte: start }),
        ...(endExclusive && { lt: endExclusive }),
      };
    }

    const [orders, total] = await prisma.$transaction([
      prisma.orderHeader.findMany({
        where,
        skip: (page - 1) * take,
        take,
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          invoiceNo: true,
          status: true,
          notes: true,
          createdAt: true,
          estHours: true,
          outlets: { select: { id: true, name: true } },
        },
      }),
      prisma.orderHeader.count({ where }),
    ]);

    return {
      data: orders,
      meta: {
        page,
        take,
        total,
        totalPages: Math.max(Math.ceil(total / take), 1),
      },
    };
  };

  getCustomerOrderById = async (customerId: string, id: string) => {
    const order = await prisma.orderHeader.findFirst({
      where: { id, customerId },
      select: {
        id: true,
        outletId: true,
        status: true,
        notes: true,
        estHours: true,
        createdAt: true,
        updatedAt: true,
        invoiceNo: true,
        outlets: { select: { name: true } },
      },
    });
    return order;
  };

  confirmRecivedByCustomer = async (
    customerId: string,
    orderHeaderId: string
  ) => {
    const order = await prisma.orderHeader.findFirst({
      where: { id: orderHeaderId, customerId },
      select: { status: true },
    });
    if (!order) {
      throw new AppError("Order not found", 404);
    }

    if (order.status !== "DELIVERED_TO_CUSTOMER") {
      throw new AppError("Order is not delivered to customer", 400);
    }

    await prisma.orderHeader.update({
      where: { id: orderHeaderId },
      data: { status: "COMPLETED", customerConfirmedAt: new Date() },
    });

    return { message: "Order confirmed as received by customer" };
  };

  autoConfirmDueOrders = async () => {
    const cutoff = new Date(Date.now() - 48 * 60 * 60 * 1000);
    const toConfirm = await prisma.orderHeader.findMany({
      where: {
        status: "DELIVERED_TO_CUSTOMER",
        deliveredAt: { lte: cutoff },
        deletedAt: null,
      },
      select: { id: true },
    });
    if (!toConfirm.length) return { message: "No orders", count: 0 };
    await prisma.$transaction(
      toConfirm.map((o) =>
        prisma.orderHeader.update({
          where: { id: o.id },
          data: { status: "COMPLETED", autoConfirmedAt: new Date() },
        })
      )
    );
    return { message: "Auto-confirmed", count: toConfirm.length };
  };
}
