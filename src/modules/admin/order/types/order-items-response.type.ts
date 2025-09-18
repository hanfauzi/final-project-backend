import {
  LaundryItem,
  OrderItem,
  OrderItemLaundry,
} from "../../../../generated/prisma";

export interface CreateOrderItem extends OrderItem {
  laundryItems: (OrderItemLaundry & { laundryItem: LaundryItem })[];
}
