import { Request, Response } from "express";
import { OrderService } from "./order.service";
import { CustomerDeliveryQueryParams, CustomerNotificationQueryParams, CustomerOrderQueryParams, CustomerPickupQueryParams } from "../pagination/pagination.dto";
import { plainToInstance } from "class-transformer";

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
    const { customerAddressId, services } = req.body;


    const result = await this.orderService.createPickUpOrderRequest({
      customerId,
      customerAddressId,
      services
    });

    res.status(201).json(result);
  };

  cancelPickUpOrderRequest = async (req: Request, res: Response) => {
    const customerId = res.locals.payload.id;
    const { id } = req.params;
    const result = await this.orderService.cancelPickUpOrderRequest(
      customerId,
      id
    );
    res.status(200).json(result);
  };

  getCustomerPickUpOrders = async (req: Request, res: Response) => {
    const customerId = res.locals.payload.id;
    const query = plainToInstance(CustomerPickupQueryParams , req.query);
    const result = await this.orderService.getCustomerPickUpOrders(customerId, query);
    res.status(200).json(result);
  }

  getCustomerPickUpOrderById = async (req: Request, res: Response) => {
    const customerId = res.locals.payload.id;
    const { id } = req.params;
    const result = await this.orderService.getCustomerPickUpOrderById(customerId, id);
    res.status(200).json(result);
  }

  getCustomerOrders = async (req: Request, res: Response) => {
    const customerId = res.locals.payload.id;
    const  query = plainToInstance( CustomerOrderQueryParams, req.query); 
   
    const result = await this.orderService.getCustomerOrders(customerId ,query);
    res.status(200).json(result);
  };

  getCustomerOrderById = async (req: Request, res: Response) => {
    const customerId = res.locals.payload.id;
    const { id } = req.params;
    const result = await this.orderService.getCustomerOrderById(customerId, id);
    res.status(200).json(result);
  };

  getCustomerDeliveryOrders = async (req: Request, res: Response) => {
    const customerId = res.locals.payload.id;
    const query = plainToInstance(CustomerDeliveryQueryParams, req.query);
    const result = await this.orderService.getCustomerDeliveryOrders(customerId, query);
    res.status(200).json(result);
  }

  getCustomerDeliveryOrderById = async (req: Request, res: Response) => {
    const customerId = res.locals.payload.id;
    const { id } = req.params;
    const result = await this.orderService.getCustomerDeliveryOrderById(customerId, id);
    res.status(200).json(result);
  }

  confirmRecivedByCustomer = async (req: Request, res: Response) => {
    const customerId = res.locals.payload.id;
    const { orderHeaderId } = req.params;
    const result = await this.orderService.confirmRecivedByCustomer(
      customerId,
      orderHeaderId
    );
    res.status(200).json(result);
  };

  autoConfirmDueOrders = async () => {
    const result = await this.orderService.autoConfirmDueOrders();
    return result;
  }

  getPendingPaymentOrders = async (req: Request, res: Response ) => {
    const customerId = res.locals.payload.id;
    const query = plainToInstance(CustomerNotificationQueryParams, req.query);
    const result = await this.orderService.getPendingPaymentOrders(customerId, query);
    res.status(200).json(result);
  }
}
