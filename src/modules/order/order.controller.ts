import { Request, Response } from "express";
import { OrderService } from "./order.service";

export class OrderController {
  private orderService: OrderService;

  constructor() {
    this.orderService = new OrderService();
  }

  createPickUpOrderRequest = async (req: Request, res: Response) => {
    const customerId = res.locals.payload.id;
    const { customerAddressId, notes } = req.body;

    const result = await this.orderService.createPickUpOrderRequest({
      customerId,
      customerAddressId,
      notes,
    });

    res.status(201).json(result);
  };
}
