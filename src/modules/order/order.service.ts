import { AppError } from "../../utils/app.error";
import { DistanceService } from "../distance/distance.service";
import prisma from "../prisma/prisma.service";
import { PickUpOrderDTO } from "./dto/pickup-order.dto";

export class OrderService {
  private distanceService: DistanceService;
  constructor() {
    this.distanceService = new DistanceService();
  }

  createPickUpOrderRequest = async ({
    customerId,
    customerAddressId,
    notes,
  }: PickUpOrderDTO & { customerId: string }) => {
    const address = await prisma.customerAddress.findFirst({
      where: { id: customerAddressId, customerId, deletedAt: null },
      select: { id: true, latitude: true, longitude: true },
    });

    if (!address) {
      throw new AppError("Customer address not found!", 404);
    }

    const outlets = await prisma.outlet.findMany({
      where: { isActive: true },
      select: { id: true, latitude: true, longitude: true, coverageArea: true },
    });

    if (!outlets.length) {
      throw new AppError("No active outlets", 404);
    }

    let chosen: { id: string; distanceKm: number } | null = null;
    for (const o of outlets) {
      const d = this.distanceService.haversineKm(
        address.latitude,
        address.longitude,
        o.latitude,
        o.longitude
      );
      if (d <= o.coverageArea) {
        if (!chosen || d < chosen.distanceKm)
          chosen = { id: o.id, distanceKm: d };
      }
    }
    if (!chosen) {
      throw new AppError("No outlet covers this address", 400);
    }

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
      },
    });

    return {
      message: "Order request created",
      data: { ...order, distanceOutletKm: Math.round(chosen.distanceKm) },
    };
  };
}
