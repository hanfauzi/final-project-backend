import { OutletService } from "./outlet/outlet.service";
import prisma from "../prisma/prisma.service";
import { PickUpOrderDTO } from "./dto/pickup-order.dto";

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
    const chosen = await this.outletService.pickOutletForAddress({
      customerId,
      customerAddressId,
    });

    const order = await prisma.orderHeader.create({
      data: {
        customerId,
        outletId: chosen.id,
        status: "WAITING_FOR_CONFIRMATION",
        notes: notes ?? "",
        estHours: null,
      },
      select: {
        id: true,
        outletId: true,
        status: true,
        createdAt: true,
        estHours: true,
        outlets: {
          select: { name: true },
        },
      },
    });

    return {
      message: "Order request created",
      data: {
        ...order,
        distanceOutletKm: Math.round(chosen.distanceKm),
      },
    };
  };

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
        outlets: { select: { name: true } },
      },
    });
    return order;
  };
}
