import { OutletService } from "./outlet/outlet.service";
import prisma from "../prisma/prisma.service";
import { PickUpOrderDTO } from "./dto/pickup-order.dto";
import { AppError } from "../../utils/app.error";

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

      const now = new Date();
      const dateKey = now.toISOString().slice(0, 10).replace(/-/g, "");
      const counter = await tx.invoiceCounter.upsert({
        where: { dateKey_outletId: { dateKey, outletId: chosen.id } },
        create: { dateKey, outletId: chosen.id, seq: 1 },
        update: { seq: { increment: 1 } },
      });

      const outlet = await tx.outlet.findFirst({
        where: { id: chosen.id },
        select: { code: true },
      });

      const outletCode = outlet?.code ?? "OUTLET";
      const invoiceNo = `INV-${dateKey}-${outletCode}-${String(counter.seq).padStart(4, "0")}`;

      const order = await tx.orderHeader.create({
        data: {
          customerId,
          outletId: chosen.id,
          status: "WAITING_FOR_CONFIRMATION",
          notes,
          estHours: null,
          invoiceNo,
        },
        select: {
          id: true,
          outletId: true,
          status: true,
          notes: true,
          estHours: true,
          createdAt: true,
          invoiceNo: true,
          outlets: { select: { name: true } },
        },
      });

      return {
        message: "Order request created",
        data: { ...order, distanceOutletKm: Math.round(chosen.distanceKm) },
      };
    });
  };

  cancelPickUpOrderRequest = async (customerId: string, id: string) => {
    const order = await prisma.orderHeader.findFirst({
      where: { id, customerId },
      select: { status: true },
    });
    if (!order) {
      throw new AppError("Order not found");
    }
    if (order.status !== "WAITING_FOR_CONFIRMATION"){
      throw new AppError("Only orders with status 'WAITING_FOR_CONFIRMATION' can be cancelled");
    }

    await prisma.orderHeader.update({
      where: { id },
      data: { status: "CANCELLED" },
    });
    return { message: "Order cancelled" };
  }

  getCustomerOrders = async (customerId: string) => {
    const orders = await prisma.orderHeader.findMany({
      where: { customerId },
      orderBy: { createdAt: "desc" },
    });

    return orders;
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
}
