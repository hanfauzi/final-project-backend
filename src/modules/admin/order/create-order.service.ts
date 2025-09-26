import {
  OrderStatus,
  PaymentStatus,
  PickupStatus,
  TaskStatus,
} from "../../../generated/prisma";
import { AppError } from "../../../utils/app.error";
import prisma from "../../prisma/prisma.service";
import { CreateOrderFromPickupDTO } from "./dto/create-order-items.dto";

export class CreateOrderAdminService {
  private async generateInvoiceNo(
    tx: any,
    outletId: string,
    outletCode?: string
  ) {
    const dateKey = new Date().toISOString().slice(0, 10).replace(/-/g, ""); // YYYYMMDD
    const existing = await tx.invoiceCounter
      .findUnique({
        where: { dateKey_outletId: { dateKey, outletId } },
      })
      .catch(() => null);

    let seq: number;
    if (!existing) {
      await tx.invoiceCounter.create({
        data: { dateKey, outletId, seq: 1 },
      });
      seq = 1;
    } else {
      const updated = await tx.invoiceCounter.update({
        where: { dateKey_outletId: { dateKey, outletId } },
        data: { seq: { increment: 1 } },
      });
      seq = updated.seq;
    }

    const code = outletCode ?? outletId.slice(0, 4).toUpperCase();
    return `${code}-${dateKey}-${seq.toString().padStart(4, "0")}`;
  }

  private async calculateUnitPrice(
    serviceId: string,
    providedUnitPrice?: number
  ) {
    if (providedUnitPrice !== undefined) return providedUnitPrice;

    const svc = await prisma.service.findFirst({
      where: { id: serviceId, deletedAt: null },
    });
    if (!svc) throw new AppError(`Service not found: ${serviceId}`, 404);

    return svc.basePrice;
  }

  showPickupOrders = async (outletId: string) => {
     try {
    const pickups = await prisma.pickUpOrder.findMany({
      where: {
        outletId,
        deletedAt: null,
        status: { not: PickupStatus.CANCELLED },
      },
      include: { customer: true, outlet: true, orderHeaders: true },
    });
    return pickups;
  } catch (err) {
    console.error("Error fetching pickup orders:", err);
    throw err; // biar frontend tetap tahu ada error
  }
  };

  showPickUpOrderDetailById = async (id: string) => {
    const pickup = await prisma.pickUpOrder.findFirst({
      where: { id, deletedAt: null },
      include: { customer: true, outlet: true },
    });
    if (!pickup) {
      throw new AppError("PickUpOrder not found", 404);
    }
    return pickup;
  };

  createOrderFromPickup = async (
    handledById: string,
    dto: CreateOrderFromPickupDTO
  ) => {
    const pickup = await prisma.pickUpOrder.findFirst({
      where: { id: dto.pickupOrderId, deletedAt: null },
      include: { outlet: true },
    });

    if (!pickup) {
      throw new AppError("PickUpOrder not found", 404);
    }
    if (!pickup.outlet) {
      throw new AppError("Pickup has no associated outlet", 400);
    }

    const outlet = pickup.outlet;
    const now = new Date();

    return await prisma.$transaction(async (tx) => {
      const invoiceNo = await this.generateInvoiceNo(
        tx,
        outlet.id,
        outlet.code ?? undefined
      );

      const orderHeader = await tx.orderHeader.create({
        data: {
          customerId: pickup.customerId ?? undefined,
          handledById,
          outletId: outlet.id,
          invoiceNo,
          status: OrderStatus.ARRIVED_AT_OUTLET,
          notes: dto.notes ?? pickup.notes ?? "",
          estHours: null,
          pickUpOrderId: pickup.id,
        },
      });

      let totalAmount = 0;
      let maxEstHours = 0;

      for (const item of dto.items) {
        if (item.qty <= 0) {
          throw new AppError("Quantity must be greater than 0", 400);
        }

        const service = await tx.service.findFirst({
          where: { id: item.serviceId, deletedAt: null },
        });
        if (!service) {
          throw new AppError("Invalid service selected", 404);
        }

        const unitPrice = await this.calculateUnitPrice(
          item.serviceId,
          item.unitPrice
        );
        const subTotal = unitPrice * item.qty;

        const createdItem = await tx.orderItem.create({
          data: {
            orderHeaderId: orderHeader.id,
            serviceId: item.serviceId,
            qty: item.qty,
            unitPrice,
            subTotal,
            note: item.note ?? null,
          },
        });

        if (item.laundryItems?.length) {
          await tx.orderItemLaundry.createMany({
            data: item.laundryItems.map((li) => {
              if (li.qty <= 0) {
                throw new AppError(
                  "Laundry item quantity must be greater than 0",
                  400
                );
              }
              return {
                orderItemId: createdItem.id,
                laundryItemId: li.laundryItemId,
                qty: li.qty,
              };
            }),
          });
        }

        if (service.estHours > maxEstHours) maxEstHours = service.estHours;

        totalAmount += subTotal;
      }

      await tx.orderHeader.update({
        where: { id: orderHeader.id },
        data: { estHours: maxEstHours },
      });

      await tx.pickUpOrder.update({
        where: { id: pickup.id },
        data: {
          status: PickupStatus.RECEIVED_BY_OUTLET,
          arrivedAtOutlet: now,
        },
      });

      return await tx.orderHeader.findUnique({
        where: { id: orderHeader.id },
        include: {
          OrderItem: { include: { orderItemLaundry: true, service: true } },
          pickUpOrder: true,
          Payment: true,
        },
      });
    });
  };
}
