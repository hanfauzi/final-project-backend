import { AppError } from "../../../utils/app.error";
import prisma from "../../prisma/prisma.service";
import { AddOrderItemsDto } from "./dto/create-order-items.dto";
import { CreateOrderItem } from "./types/order-items-response.type";

export class CreateOrderAdminService {
  createOrderItems = async (
    orderHeaderId: string,
    handledById: string,
    dto: AddOrderItemsDto
  ) => {
    return await prisma.$transaction(async (tx) => {
      const orderHeader = await tx.orderHeader.findFirst({
        where: { id: orderHeaderId, deletedAt: null, status: "ON_THE_WAY_TO_OUTLET" },
      });
      if (!orderHeader) {
        throw new AppError("Please choose order status ON THE WAY TO OUTLET", 404);
      }

      const updatedOrderHeader = await tx.orderHeader.update({
        where: { id: orderHeaderId },
        data: { handledById, status: "ARRIVED_AT_OUTLET" },
      });

      const createdItems: CreateOrderItem[] = [];

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

        const unitPrice = service.basePrice;
        const subTotal = unitPrice * item.qty;

        const orderItem = await tx.orderItem.create({
          data: {
            orderHeaderId,
            serviceId: service.id,
            qty: item.qty,
            unitPrice,
            subTotal,
            note: item.note,
          },
          include: { service: true },
        });

        item.laundryItems.forEach((li) => {
          if (li.qty <= 0) {
            throw new AppError(
              "Laundry item quantity must be greater than 0",
              400
            );
          }
        });

        // Simpan laundry items
        await tx.orderItemLaundry.createMany({
          data: item.laundryItems.map((li) => ({
            orderItemId: orderItem.id,
            laundryItemId: li.laundryItemId,
            qty: li.qty,
          })),
        });

        const laundryItems = await tx.orderItemLaundry.findMany({
          where: { orderItemId: orderItem.id },
          include: { laundryItem: true },
        });

        createdItems.push({ ...orderItem, laundryItems });
      }

      const grandTotal = createdItems.reduce(
        (acc, curr) => acc + curr.subTotal,
        0
      );

      return {
        orderHeader: updatedOrderHeader,
        orderItems: createdItems,
        grandTotal,
      };
    });
  };
}
