import { Request, Response } from "express";
import { ProfileService } from "./profile.service";
import { CloudinaryService } from "../../cloudinary/cloudinary.service";

export class ProfileController {
  private profileService: ProfileService;
  private cloudinaryService: CloudinaryService;
  constructor() {
    this.profileService = new ProfileService();
    this.cloudinaryService = new CloudinaryService();
  }

  getCustomerProfileById = async (req: Request, res: Response) => {
    const id = res.locals.payload.sub;
    const result = await this.profileService.getCustomerProfileById(id);

    res.status(200).json(result);
  };

  customerProfileUpdate = async (req: Request, res: Response) => {
    const file = req.file;
    const id = res.locals.payload.sub;

    let photoUrl;

    if (file) {
      const uploaded = await this.cloudinaryService.upload(
        file,
        "photo-profile"
      );
      photoUrl = uploaded.secure_url;
    }

    const result = await this.profileService.customerProfileUpdate({
      id,
      ...req.body,
      ...(photoUrl && { photoUrl }),
    });

    res.status(200).json(result);
  };

  customerEmailUpdate = async (req: Request, res: Response) => {
    const id = res.locals.payload.sub;
    const {email } = req.body
    const result = await this.profileService.customerEmailUpdate({
      id,
      email,
    });
console.log(result)
    res.status(200).json(result);
  };

  verifyEmailByToken = async (req: Request, res: Response) => {
    const { token } = req.params;

    const result = await this.profileService.verifyEmailByToken(token);

    res.status(200).json(result);
  };
}
