import { plainToInstance } from "class-transformer";
import { validateOrReject } from "class-validator";
import { Request, Response } from "express";
import { AppError } from "../../../utils/app.error";
import { GetAllOrdersDto } from "./dto/get-all-orders.dto";
import { OrderTrackingService } from "./order-tracking.service";
import { OrderAdminService } from "./order.service";
import { OrderStatus } from "../../../generated/prisma";

export class OrderAdminController {
  private orderAdminService: OrderAdminService;
  private orderTrackingService: OrderTrackingService;
  constructor() {
    this.orderAdminService = new OrderAdminService();
    this.orderTrackingService = new OrderTrackingService();
  }

  getAllOrders = async (req: Request, res: Response) => {
    const dto = plainToInstance(GetAllOrdersDto, req.query, {
      enableImplicitConversion: true,
    });
    await validateOrReject(dto);
    const orders = await this.orderAdminService.getAllOrders(dto);
    res.status(200).json({ message: `Orders loaded successfully`, ...orders });
  };

  getOrderDetailById = async (req: Request, res: Response) => {
    const { id } = req.params;
    const order = await this.orderAdminService.getOrderDetailById(id);
    res
      .status(200)
      .json({
        message: `Order from ${order.customers?.name} loaded successfully`,
        ...order,
      });
  };

  getAllOrdersForOutletAdmin = async (req: Request, res: Response) => {
    const dto = plainToInstance(GetAllOrdersDto, req.query, {
      enableImplicitConversion: true,
    });
    await validateOrReject(dto);

    const outletId = res.locals.payload.outletId;
    const orders = await this.orderAdminService.getAllOrdersForOutletAdmin(
      outletId,
      dto
    );
    res.status(200).json({ message: `Orders loaded successfully`, ...orders });
  };

  getOrdersTracking = async (req: Request, res: Response) => {
    const outletId = res.locals.payload?.outletId;

    const {
      status,
      employeeId,
      dateFrom,
      dateTo,
      page = "1",
      limit = "10",
    } = req.query;

    const filters = {
      outletId,
      status: status ? (status as OrderStatus) : undefined,
      employeeId: employeeId ? String(employeeId) : undefined,
      dateFrom: dateFrom ? new Date(String(dateFrom)) : undefined,
      dateTo: dateTo ? new Date(String(dateTo)) : undefined,
      page: Number(page),
      limit: Number(limit),
    };

    const result = await this.orderTrackingService.getOrdersTracking(filters);
    res
      .status(200)
      .json({ message: "Orders tracking loaded successfully", ...result });
  };
}
