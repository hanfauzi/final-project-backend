import { Request, Response } from "express";
import { plainToInstance } from "class-transformer";
import { GetDeliveryOrdersByDriverService } from "./services/getDeliveryOrdersByDriver.service";
import { GetDeliveryOrderByIdService } from "./services/getDeliveryOrderById.service";
import { ProcessDeliveryOrderService } from "./services/processDeliveryOrder.service";
import { GetDeliveryOrdersByDriverDTO } from "./dto/getDeliveryOrdersByDriver.dto";

export class DeliveryOrderController {
  private getDeliveryOrdersByDriverService: GetDeliveryOrdersByDriverService;
  private getDeliveryOrderByIdService: GetDeliveryOrderByIdService;
  private processDeliveryOrderService: ProcessDeliveryOrderService;

  constructor() {
    this.getDeliveryOrdersByDriverService = new GetDeliveryOrdersByDriverService();
    this.getDeliveryOrderByIdService = new GetDeliveryOrderByIdService();
    this.processDeliveryOrderService = new ProcessDeliveryOrderService();
  }

  getDeliveryOrdersByDriver = async (req: Request, res: Response) => {
    const authUser = res.locals.payload;
    const query = plainToInstance(GetDeliveryOrdersByDriverDTO, req.query);
    const mode = query.mode ?? "AVAILABLE_TASK";
    const result = await this.getDeliveryOrdersByDriverService.getDeliveryOrdersByDriver(authUser, query, mode);
    res.status(200).json(result);
  };

  getDeliveryOrderById = async (req: Request, res: Response) => {
    const authUser = res.locals.payload;
    const { id: deliveryOrderId } = req.params;
    const result = await this.getDeliveryOrderByIdService.getDeliveryOrderById(authUser, deliveryOrderId);
    res.status(200).json(result);
  };

  processDeliveryOrder = async (req: Request, res: Response) => {
    const authUser = res.locals.payload;
    const { id: deliveryOrderId } = req.params;
    const result = await this.processDeliveryOrderService.processDeliveryOrder(authUser, deliveryOrderId);
    res.status(200).json(result);
  };
}
