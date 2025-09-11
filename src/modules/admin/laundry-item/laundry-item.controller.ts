import { NextFunction, Request, Response } from "express";
import { LaundryItemService } from "./laundry-item.service";

export class LaundryItemController {
    private laundryItemService: LaundryItemService;
    constructor() {
        this.laundryItemService = new LaundryItemService();
    }

    getAllLaundryItems = async(req: Request, res: Response, next: NextFunction) => {
        try {
            const result = await this.laundryItemService.getAllLaundryItems();
            res.status(200).json({ message: "Get all laundry items data successfully", data: result });
        } catch (error) {
            next(error);
        }
    }

    getLaundryItemDetailById = async(req: Request, res: Response, next: NextFunction) => {
        try {
            const { id } = req.params;
            const result = await this.laundryItemService.getLaundryItemDetailById(id);
            res.status(200).json({ message: `item ${result.name} loaded successfully`, data: result });
        } catch (error) {
            next(error);
        }
    }

    createLaundryItem = async(req: Request, res: Response, next: NextFunction) => {
        try {
            const result = await this.laundryItemService.createLaundryItem(req.body);
            res.status(201).json({ message: "Laundry item created successfully", data: result });
        } catch (error) {
            next(error);
        }
    }

    updateLaundryItem = async(req: Request, res: Response, next: NextFunction) => {
        try {
            const { id } = req.params;
            const data = req.body;
            const result = await this.laundryItemService.updateLaundryItem(id, data);
            res.status(200).json({ message: "Laundry item updated successfully", data: result });
        } catch (error) {
            next(error);
        }
    }

    deleteLaundryItem = async(req: Request, res: Response, next: NextFunction) => {
        try {
            const { id } = req.params;
            const result = await this.laundryItemService.deleteLaundryItem(id);
            res.status(200).json({ message: "Laundry item deleted successfully", data: result });
        } catch (error) {
            next(error);
        }
    }

    restoreLaundryItem = async(req: Request, res: Response, next: NextFunction) => {
        try {
            const { id } = req.params;
            const result = await this.laundryItemService.restoreLaundryItem(id);
            res.status(200).json({ message: "Laundry item restored successfully", data: result });
        } catch (error) {
            next(error);
        }
    }
}