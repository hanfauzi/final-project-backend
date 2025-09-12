import { plainToInstance } from "class-transformer";
import { validateOrReject } from "class-validator";
import { Request, Response } from "express";
import { GetAllOrdersDto } from "./dto/get-all-orders.dto";
import { OrderAdminService } from "./order.service";


export class OrderAdminController {
    private orderAdminService: OrderAdminService;
    constructor() {
        this.orderAdminService = new OrderAdminService();
    }

    getAllOrders = async (req: Request, res: Response) => {
        const dto = plainToInstance(GetAllOrdersDto, req.query, {
            enableImplicitConversion: true,
        });
        await validateOrReject(dto);
        const orders = await this.orderAdminService.getAllOrders(dto);
        res.status(200).json({ message: `Orders loaded successfully`, data: orders });
    };

    getOrderDetailById = async (req: Request, res: Response) => {
        const { id } = req.params;
        const order = await this.orderAdminService.getOrderDetailById(id);
        res.status(200).json({ message: `Order loaded successfully`, data: order });
    };
}