import { OutletService } from "./outlet/outlet.service";
import prisma from "../prisma/prisma.service";
import { PickUpOrderDTO } from "./dto/pickup-order.dto";
import { AppError } from "../../utils/app.error";
import {
  DeliveryStatus,
  OrderStatus,
  PickupStatus,
  Prisma,
} from "../../generated/prisma";
import {
  CustomerDeliveryQueryParams,
  CustomerOrderQueryParams,
  CustomerPickupQueryParams,
} from "../pagination/pagination.dto";

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

    const [rows, total] = await prisma.$transaction([
      prisma.orderHeader.findMany({
        where,
        skip: (page - 1) * take,
        take,
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          invoiceNo: true,
          status: true,
          createdAt: true,
          estHours: true,
          outlets: { select: { id: true, name: true } },
          deliveryOrder: { select: { id: true, status: true } },
          _count: { select: { OrderItem: true } },
          OrderItem: {
            take: 1,
            orderBy: { createdAt: "asc" },
            select: {
              service: { select: { name: true } },
            },
          },
        },
      }),
      prisma.orderHeader.count({ where }),
    ]);

    const orders = rows.map((o) => {
      const firstName = o.OrderItem[0]?.service?.name ?? null;
      const extra = (o._count?.OrderItem ?? 0) - 1;
      const serviceLabel = firstName
        ? extra > 0
          ? `${firstName} +${extra} layanan`
          : firstName
        : "Tanpa layanan";

      return {
        id: o.id,
        invoiceNo: o.invoiceNo,
        status: o.status,
        createdAt: o.createdAt,
        estHours: o.estHours,
        outlets: o.outlets,
        deliveryOrder: o.deliveryOrder,
        serviceLabel,
      };
    });

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
    const row = await prisma.orderHeader.findFirst({
      where: { id, customerId, deletedAt: null },
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
        deliveryOrder: { select: { id: true, status: true } },
        OrderItem: {
          orderBy: { createdAt: "asc" },
          select: {
            id: true,
            qty: true,
            unitPrice: true,
            subTotal: true,
            service: { select: { id: true, name: true, unit: true } },
          },
        },
      },
    });

     if (!row) return null;

  const firstName = row.OrderItem[0]?.service?.name ?? null;
  const extra = row.OrderItem.length - 1;
  const serviceLabel = firstName
    ? extra > 0
      ? `${firstName} +${extra} layanan`
      : firstName
    : "Tanpa layanan";

  return {
    id: row.id,
    outletId: row.outletId,
    status: row.status,
    estHours: row.estHours,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
    invoiceNo: row.invoiceNo,
    outlets: row.outlets,
    deliveryOrder: row.deliveryOrder,
    items: row.OrderItem.map((it) => ({
      id: it.id,
      qty: it.qty,
      unitPrice: it.unitPrice,
      subTotal: it.subTotal,
      service: {
        id: it.service.id,
        name: it.service.name,
        unit: it.service.unit,
      },
    })),
    serviceLabel, 
  };
    
  };

  getCustomerDeliveryOrders = async (
    customerId: string,
    query: CustomerDeliveryQueryParams
  ) => {
    const { page = 1, take = 5, status, invoiceNo, dateFrom, dateTo } = query;

    const orderHeaderWhere: Prisma.OrderHeaderWhereInput = { customerId };

    if (invoiceNo) {
      orderHeaderWhere.invoiceNo = { contains: invoiceNo, mode: "insensitive" };
    }

    let createdAtFilter: Prisma.DateTimeFilter | undefined;
    if (dateFrom || dateTo) {
      const start = dateFrom
        ? new Date(`${dateFrom}T00:00:00.000Z`)
        : undefined;
      const endExclusive = dateTo
        ? new Date(
            new Date(`${dateTo}T00:00:00.000Z`).getTime() + 24 * 60 * 60 * 1000
          )
        : undefined;

      createdAtFilter = {
        ...(start && { gte: start }),
        ...(endExclusive && { lt: endExclusive }),
      };
    }

    const where: Prisma.DeliveryOrderWhereInput = {
      deletedAt: null,
      orderHeader: { is: orderHeaderWhere },
      ...(createdAtFilter && { createdAt: createdAtFilter }),
    };

    const isDeliveryStatus = (s: string): s is DeliveryStatus =>
      Object.values(DeliveryStatus).includes(s as DeliveryStatus);
    if (status && isDeliveryStatus(status as any)) {
      where.status = status as DeliveryStatus;
    }

    const [deliveries, total] = await prisma.$transaction([
      prisma.deliveryOrder.findMany({
        where,
        skip: (page - 1) * take,
        take,
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          outletId: true,
          outlet: { select: { id: true, name: true, cityName: true } },
          customerAddressId: true,
          orderHeaderId: true,
          distance: true,
          price: true,
          status: true,
          scheduledAt: true,
          deliveredAt: true,
          createdAt: true,
          updatedAt: true,
          driver: { select: { id: true, name: true, phoneNumber: true } },
          orderHeader: {
            select: {
              id: true,
              invoiceNo: true,
              status: true,
              createdAt: true,
            },
          },
        },
      }),
      prisma.deliveryOrder.count({ where }),
    ]);

    return {
      data: deliveries,
      meta: {
        page,
        take,
        total,
        totalPages: Math.max(Math.ceil(total / take), 1),
      },
    };
  };

  getCustomerDeliveryOrderById = async (customerId: string, id: string) => {
    const delivery = await prisma.deliveryOrder.findFirst({
      where: {
        id,
        deletedAt: null,
        orderHeader: { customerId },
      },
      select: {
        id: true,
        status: true,
        distance: true,
        price: true,
        scheduledAt: true,
        deliveredAt: true,
        createdAt: true,
        updatedAt: true,
        outlet: {
          select: { id: true, name: true, cityName: true, address: true },
        },
        driver: {
          select: { id: true, name: true, phoneNumber: true },
        },
        customerAddress: {
          select: {
            id: true,
            label: true,
            address: true,
            city: true,
            latitude: true,
            longitude: true,
            phoneNumber: true,
          },
        },
        orderHeader: {
          select: { id: true, invoiceNo: true, status: true, createdAt: true },
        },
      },
    });

    if (!delivery) throw new AppError("Delivery order not found", 404);
    return delivery;
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
