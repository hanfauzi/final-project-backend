import { transporter } from "../../lib/nodemailer";
import { expiryFromNow, randomToken, VERIFY_TTL_MS } from "../../lib/token";
import { AppError } from "../../utils/app.error";
import { PasswordService } from "../password/password.service";
import prisma from "../prisma/prisma.service";
import { CustomerProfileUpdateDTO } from "./dto/customer.dto";
import fs from "fs";
import Handlebars from "handlebars";

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
    phoneNumber,
    photoUrl,
  }: CustomerProfileUpdateDTO & { id: string }) => {
    const customer = await prisma.customer.findUnique({ where: { id } });
    if (!customer) throw new AppError("Customer not found!", 404);

    const dataToUpdate: CustomerProfileUpdateDTO = {
      ...(name && { name }),
      ...(phoneNumber && { phoneNumber }),
      ...(photoUrl && { photoUrl }),
    };

    await prisma.customer.update({ where: { id }, data: dataToUpdate });
    return { message: "Profile update succesfully!" };
  };

  customerEmailUpdate = async ({
    id,
    email,
  }: CustomerProfileUpdateDTO & { id: string }) => {
    const customer = await prisma.customer.findUnique({ where: { id } });

    if (!customer) throw new AppError("Customer not found!", 404);

    if (customer.selectProvider) {
      throw new AppError("This account can't change their email address!", 401);
    }

    const newEmail = (email ?? "").trim().toLowerCase();
    if (!newEmail) throw new AppError("Email is required!", 400);
    if (newEmail === customer.email)
      throw new AppError("Email is the same. Nothing changed.", 400);

    const exists = await prisma.customer.findFirst({
      where: { email: newEmail },
    });
    if (exists) throw new AppError("Email already used!", 400);

    const token = randomToken();
    const expiresAt = expiryFromNow(VERIFY_TTL_MS);

    const updated = await prisma.customer.update({
      where: { id },
      data: {
        email: newEmail,
        isVerified: false,
        verifyToken: token,
        verifyTokenExpiresAt: expiresAt,
      },
      select: { id: true, email: true, isVerified: true },
    });

    try {
      const templateHtml = fs.readFileSync(
        "src/assets/reverifyEmail.html",
        "utf-8"
      );
      const compiledHtml = Handlebars.compile(templateHtml);
      const resultHtml = compiledHtml({
        linkUrl: `${process.env.VERIFY_URL_CUSTOMER!}/${token}`,
        email: updated?.email,
        expiresInMinutes: Math.floor(VERIFY_TTL_MS / 60000),
        year: new Date().getFullYear(),
      });

      await transporter.sendMail({
        subject: "Verify Your New Email",
        to: updated.email,
        html: resultHtml,
      });

      return { message: "Email updated! Please check your inbox to verify." };
    } catch (error) {
      throw new AppError(
        "Failed to send reset verify email. Please try again.",
        500
      );
    }
  };

  verifyEmailByToken = async (token: string) => {
    if (!token) throw new AppError("Token is required!", 400);

    const now = new Date();
    const customer = await prisma.customer.findFirst({
      where: {
        verifyToken: token,
        verifyTokenExpiresAt: { gt: now },
      },
    });
    if (!customer) throw new AppError("Invalid or expired token", 400);

    await prisma.customer.update({
      where: { id: customer.id },
      data: {
        isVerified: true,
        verifyToken: null,
        verifyTokenExpiresAt: null,
      },
    });

    return {
      message:
        "Email change successfully and your account has been verified. You can login with new email now!",
    };
  };
}
