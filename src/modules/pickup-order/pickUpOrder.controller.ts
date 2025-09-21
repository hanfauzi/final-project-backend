import { Request, Response } from "express";
import { plainToInstance } from "class-transformer";
import { GetPickUpOrdersByDriverService } from "./services/getPickUpOrdersByDriver.service";
import { GetPickUpOrderByIdService } from "./services/getPickUpOrderById.service";
import { UpdatePickUpOrderService } from "./services/processPickUpOrder.service";
import { GetPickUpOrdersByDriverDTO } from "./dto/getPickUpOrdersByDriver.dto";

export class PickUpOrderController {
  private getPickUpOrderByDriverService: GetPickUpOrdersByDriverService;
  private getPickUpOrderByIdService: GetPickUpOrderByIdService;
  private updatePickUpOrderService: UpdatePickUpOrderService;

  constructor() {
    this.getPickUpOrderByDriverService = new GetPickUpOrdersByDriverService();
    this.getPickUpOrderByIdService = new GetPickUpOrderByIdService();
    this.updatePickUpOrderService = new UpdatePickUpOrderService();
  }

  getPickUpOrdersByDriver = async (req: Request, res: Response) => {
    const authUser = res.locals.payload;
    const query = plainToInstance(GetPickUpOrdersByDriverDTO, req.query);
    const result = await this.getPickUpOrderByDriverService.getPickUpOrdersByDriver(authUser, query);
    res.status(200).json(result);
  };

  getPickUpOrderById = async (req: Request, res: Response) => {
    const authUser = res.locals.payload;
    const { id: pickUpOrderId } = req.params;
    const result = await this.getPickUpOrderByIdService.getPickUpOrderById(authUser, pickUpOrderId);
    res.status(200).json(result);
  };

  processPickUpOrder = async (req: Request, res: Response) => {
    const authUser = res.locals.payload;
    const { id: pickUpOrderId } = req.params;
    const result = await this.updatePickUpOrderService.processPickUpOrder(authUser, pickUpOrderId);
    res.status(200).json(result);
  };
}
