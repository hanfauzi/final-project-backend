import { AppError } from "../../utils/app.error";
import { PasswordService } from "../password/password.service";
import prisma from "../prisma/prisma.service";
import { CustomerProfileUpdateDTO } from "./dto/customer.dto";

export class ProfileService {
  private passwordService: PasswordService;

  constructor() {
    this.passwordService = new PasswordService();
  }

  getCustomerProfileById = async (id: string) => {
    const customer = await prisma.customer.findUnique({
      where: { id },
      select: {
        name: true,
        email: true,
        phoneNumber: true,
        photoUrl: true,
      },
    });

    if (!customer) {
      throw new AppError("Customer not found!", 404);
    }

    return customer;
  };

  customerProfileUpdate = async ({
    id,
    name,
    email,
    phoneNumber,
    photoUrl,
  }: CustomerProfileUpdateDTO & { id: string }) => {
    const customer = await prisma.customer.findFirst({ where: { id } });

    if (!customer) {
      throw new AppError("Customer not found!", 404);
    }

    if (email && email !== customer.email) {
      const existing = await prisma.customer.findFirst({ where: { email } });
      if (existing) throw new AppError("Email already used!", 400);
    }

    const dataToUpdate: CustomerProfileUpdateDTO = {
      ...(name && { name }),
      ...(email && { email }),
      ...(phoneNumber && { phoneNumber }),
      ...(photoUrl && { photoUrl }),
    };

    return await prisma.customer.update({
      where: { id },
      data: dataToUpdate,
      select: {
        name: true,
        email: true,
        phoneNumber: true,
        photoUrl: true,
      },
    });
  };
}
