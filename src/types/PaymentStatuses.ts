import { OrderStatus } from "../generated/prisma";

export const PAYABLE_STATUSES = new Set<OrderStatus>([
  OrderStatus.ARRIVED_AT_OUTLET,
  OrderStatus.WASHING_IN_PROGRESS,
  OrderStatus.IRONING_IN_PROGRESS,
  OrderStatus.PACKING_IN_PROGRESS,
  OrderStatus.WAITING_FOR_PAYMENT,
]);
