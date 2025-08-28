import { Request, Response } from "express";
import { ProfileService } from "./profile.service";

export class ProfileController {
  private profileService: ProfileService;
  constructor() {
    this.profileService = new ProfileService();
  }

  getCustomerProfileById = async (req: Request, res: Response) => {
    const id = res.locals.payload.sub
    const result = await this.profileService.getCustomerProfileById(id)
  
    res.status(200).json(result)
}
}
