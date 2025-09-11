import { Request, Response } from "express";
import { OrderService } from "./order.service";

export class OrderController {
  private orderService: OrderService;

  constructor() {
    this.orderService = new OrderService();
  }

  suggestPickUpOutlet = async (req: Request, res: Response) => {
    const customerId = res.locals.payload.id;
    const { customerAddressId } = req.query as { customerAddressId: string };
    const result = await this.orderService.suggestPickUpOutlet({
      customerId,
      customerAddressId,
    });
    res.status(200).json(result);
  };

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
