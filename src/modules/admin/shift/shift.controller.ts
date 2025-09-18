import { Request, Response } from "express";
import { ShiftService } from "./shift.service";

export class ShiftController {
    private shiftService: ShiftService;
    
    constructor(){
        this.shiftService = new ShiftService()
    }

    getAllShifts = async(_: Request, res: Response) => {
        const result = await this.shiftService.getAllShift()
        res.status(200).json({message: "Get all shifts succesfully", data: (result)})
    }
}