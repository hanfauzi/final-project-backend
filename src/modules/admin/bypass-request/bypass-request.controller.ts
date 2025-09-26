import { Request, Response } from "express";
import { BypassRequestService } from "./bypass-request.service";

export class BypassRequestController {
  private service: BypassRequestService;
  constructor() {
    this.service = new BypassRequestService();
  }

  getRequests = async (req: Request, res: Response) => {
    const requests = await this.service.getRequests(
      res.locals.payload.outletId
    );
    res
      .status(200)
      .json({ message: "Get bypass requests successfully", data: requests });
  };

  reviewBypass = async (req: Request, res: Response) => {
    const adminId = res.locals.payload.id;
    const taskId = req.params.taskId;
    const { approve, note } = req.body;

    const updatedTask = await this.service.reviewBypass({
      adminId,
      taskId,
      approve,
      note,
    });
    res
      .status(200)
      .json({
        message: "Review bypass request successfully",
        data: updatedTask,
      });
  };
}
