import { DeliveryStatus, PickupStatus, Prisma } from "../../generated/prisma";
import { AppError } from "../../utils/app.error";
import {
  CustomerDeliveryQueryParams,
  CustomerNotificationQueryParams,
  CustomerOrderQueryParams,
  CustomerPickupQueryParams,
} from "../pagination/pagination.dto";
import prisma from "../prisma/prisma.service";
import { PickUpOrderDTO } from "./dto/pickup-order.dto";
import { OutletService } from "./outlet/outlet.service";

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

    const distanceKm = Math.min(Math.round(chosen.distanceKm), 5);
    const pickupPrice = distanceKm * 3000;

    return {
      message: "Suggested outlet",
      data: {
        outletId: chosen.id,
        outletName: chosen.name,
        distanceOutletKm: Math.round(chosen.distanceKm),
        estimatedPickupPrice: pickupPrice,
      },
    };
  };

  createPickUpOrderRequest = async ({
    customerId,
    customerAddressId,
    services,
    receiverName,
    receiverPhone,
  }: PickUpOrderDTO & { customerId: string }) => {
    const chosen = await this.outletService.pickOutletForAddress({ customerId, customerAddressId });
  if (!chosen) throw new AppError("Tidak ada outlet dalam coverage area.", 400);

  const [cust, addr] = await Promise.all([
    prisma.customer.findUnique({ where: { id: customerId }, select: { name: true } }),
    prisma.customerAddress.findUnique({ where: { id: customerAddressId }, select: { phoneNumber: true, customerId: true } }),
  ]);

  if (!addr || addr.customerId !== customerId) {
    throw new AppError("Alamat tidak valid.", 400);
  }

  const serviceids = Array.from(new Set((services ?? []).filter(Boolean)));
  if (serviceids.length === 0) throw new AppError("Pilih minimal 1 service.", 400);

  const existing = await prisma.service.findMany({
    where: { id: { in: serviceids } },
    select: { id: true },
  });
  if (existing.length !== serviceids.length) {
    const found = new Set(existing.map((s) => s.id));
    const missing = serviceids.filter((id) => !found.has(id));
    throw new AppError(`Service tidak ditemukan: ${missing.join(", ")}`, 400);
  }

  const raw = Number(chosen?.distanceKm);
  if (!Number.isFinite(raw)) throw new AppError("Jarak outlet tidak valid.", 400);
  const distanceKm = Math.min(Math.max(Math.round(raw), 0), 5);
  const pickupPrice = distanceKm * 3000;

  const resolvedReceiverName = receiverName?.trim() || cust?.name || "Customer";
  const resolvedReceiverPhone = receiverPhone?.trim() || addr?.phoneNumber || undefined;

  return prisma.$transaction(
    async (tx) => {
      const pickUpOrder = await tx.pickUpOrder.create({
        data: {
          customerId,
          outletId: chosen.id,
          customerAddressId,
          distance: distanceKm,
          price: pickupPrice,
          status: "WAITING_FOR_DRIVER",
          services: serviceids,
          receiverName: resolvedReceiverName,
          receiverPhone: resolvedReceiverPhone,
        },
        select: {
          id: true,
          outletId: true,
          distance: true,
          price: true,
          createdAt: true,
          status: true,
          services: true,
          receiverName: true,
          receiverPhone: true,
        },
      });

      return { message: "Pick up order created", data: pickUpOrder };
    },
    { maxWait: 5_000, timeout: 15_000, isolationLevel: "ReadCommitted" as any }
  );
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
          receiverName: true,
          receiverPhone: true,
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
        receiverName: true,
        receiverPhone: true,
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
    if (invoiceNo)
      where.invoiceNo = { contains: invoiceNo, mode: "insensitive" };

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
          pickUpOrderId: true,
          pickUpOrder: { select: { id: true, price: true } },
          deliveryOrder: { select: { id: true, status: true, price: true } },
          outlets: { select: { id: true, name: true } },
        },
      }),
      prisma.orderHeader.count({ where }),
    ]);

    const ids = rows.map((r) => r.id);
    if (ids.length === 0) {
      return {
        data: [],
        meta: {
          page,
          take,
          total,
          totalPages: Math.max(Math.ceil(total / take), 1),
        },
      };
    }

    const payRows = await prisma.payment.findMany({
      where: { orderHeaderId: { in: ids } },
      orderBy: { createdAt: "desc" },
      select: {
        orderHeaderId: true,
        status: true,
        paidAt: true,
        createdAt: true,
      },
    });

    const latestPayByOrder = new Map<
      string,
      { status: string; paidAt: Date | null }
    >();
    for (const p of payRows) {
      if (!latestPayByOrder.has(p.orderHeaderId)) {
        latestPayByOrder.set(p.orderHeaderId, {
          status: p.status,
          paidAt: p.paidAt ?? null,
        });
      }
    }

    const itemsByOrder = await prisma.orderItem.groupBy({
      by: ["orderHeaderId"],
      where: { orderHeaderId: { in: ids }, deletedAt: null },
      _sum: { subTotal: true },
    });
    const sumMap = new Map(
      itemsByOrder.map((x) => [x.orderHeaderId, x._sum.subTotal ?? 0])
    );

    const pickupIds = Array.from(
      new Set(rows.map((r) => r.pickUpOrderId).filter(Boolean))
    ) as string[];
    const firstOrderIdByPickup = new Map<string, string>();
    if (pickupIds.length) {
      const pickRows = await prisma.orderHeader.findMany({
        where: { pickUpOrderId: { in: pickupIds }, deletedAt: null },
        select: { id: true, pickUpOrderId: true, createdAt: true },
        orderBy: [
          { pickUpOrderId: "asc" },
          { createdAt: "asc" },
          { id: "asc" },
        ],
      });
      for (const r of pickRows) {
        const pid = r.pickUpOrderId!;
        if (!firstOrderIdByPickup.has(pid)) firstOrderIdByPickup.set(pid, r.id);
      }
    }

    const svcRows = await prisma.orderItem.findMany({
      where: { orderHeaderId: { in: ids }, deletedAt: null },
      select: {
        orderHeaderId: true,
        service: { select: { name: true } },
      },
      orderBy: { createdAt: "asc" },
    });
    const svcNameMap = new Map<string, string[]>();
    for (const r of svcRows) {
      const name = r.service?.name ?? null;
      if (!name) continue;
      const arr = svcNameMap.get(r.orderHeaderId) ?? [];
      if (!arr.includes(name)) arr.push(name);
      svcNameMap.set(r.orderHeaderId, arr);
    }

    const orders = rows.map((o) => {
      const serviceNames = svcNameMap.get(o.id) ?? [];
      const serviceLabel = serviceNames.length
        ? serviceNames.join(", ")
        : "Tanpa layanan";

      const latestPay = latestPayByOrder.get(o.id);
      const isPaid = latestPay?.status === "PAID";
      const paidAt = latestPay?.paidAt ?? null;

      const itemsTotal = sumMap.get(o.id) ?? 0;
      const isFirstOfPickup = o.pickUpOrderId
        ? firstOrderIdByPickup.get(o.pickUpOrderId) === o.id
        : false;

      const pickupFee = isFirstOfPickup ? (o.pickUpOrder?.price ?? 0) : 0;
      const deliveryFee = o.deliveryOrder?.price ?? 0;
      const amount = itemsTotal + pickupFee + deliveryFee;

      return {
        id: o.id,
        invoiceNo: o.invoiceNo,
        status: o.status,
        createdAt: o.createdAt,
        estHours: o.estHours,
        outlets: o.outlets,
        deliveryOrder: o.deliveryOrder,
        serviceNames,
        serviceLabel,
        amount,
        breakdown: {
          itemsTotal,
          pickupFeeApplied: pickupFee,
          deliveryFee,
        },
        isPaid,
        paidAt,
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
        pickUpOrderId: true,
        pickUpOrder: { select: { id: true, price: true } },
        deliveryOrder: { select: { id: true, status: true, price: true } },

        outlets: { select: { name: true } },
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

    const itemsTotal = row.OrderItem.reduce(
      (s, it) => s + (it.subTotal ?? 0),
      0
    );

    let isFirstOfPickup = false;
    if (row.pickUpOrderId) {
      const first = await prisma.orderHeader.findFirst({
        where: { pickUpOrderId: row.pickUpOrderId, deletedAt: null },
        orderBy: { createdAt: "asc" },
        select: { id: true },
      });
      isFirstOfPickup = first?.id === row.id;
    }

    const pickupFee = isFirstOfPickup ? (row.pickUpOrder?.price ?? 0) : 0;
    const deliveryFee = row.deliveryOrder?.price ?? 0;
    const amount = itemsTotal + pickupFee + deliveryFee;

    const latestPayment = await prisma.payment.findFirst({
      where: { orderHeaderId: row.id },
      orderBy: { createdAt: "desc" },
      select: { status: true, paidAt: true },
    });
    const isPaid = latestPayment?.status === "PAID";
    const paidAt = latestPayment?.paidAt ?? null;

    const serviceNames = Array.from(
      new Set(row.OrderItem.map((it) => it.service.name))
    );
    const serviceLabel = serviceNames.length
      ? serviceNames.join(", ")
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
      serviceNames,
      serviceLabel,
      amount,
      breakdown: {
        itemsTotal,
        pickupFeeApplied: pickupFee,
        deliveryFee,
      },
      isPaid,
      paidAt,
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

    await prisma.deliveryOrder.updateMany({
      where: { orderHeaderId },
      data: { status: "COMPLETED" },
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

    const ids = toConfirm.map((o) => o.id);

    await prisma.$transaction([
      ...toConfirm.map((o) =>
        prisma.orderHeader.update({
          where: { id: o.id },
          data: { status: "COMPLETED", autoConfirmedAt: new Date() },
        })
      ),
      prisma.deliveryOrder.updateMany({
        where: { orderHeaderId: { in: ids } },
        data: { status: "COMPLETED" },
      }),
    ]);

    return { message: "Auto-confirmed", count: toConfirm.length };
  };
  getPendingPaymentOrders = async (
    customerId: string,
    query: CustomerNotificationQueryParams
  ) => {
    const take = query?.take ?? 5;

    const where: Prisma.OrderHeaderWhereInput = {
      customerId,
      deletedAt: null,
      status: "WAITING_FOR_PAYMENT",
    };

    const rows = await prisma.orderHeader.findMany({
      where,
      take,
      orderBy: { updatedAt: "desc" },
      select: {
        id: true,
        invoiceNo: true,
        createdAt: true,
        updatedAt: true,
        outlets: { select: { name: true } },
      },
    });

    return rows.map((r) => ({
      id: r.id,
      invoiceNo: r.invoiceNo,
      createdAt: r.createdAt,
      updatedAt: r.updatedAt,
      outletName: r.outlets?.name ?? null,
    }));
  };
}
