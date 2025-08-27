import fs from "fs";
import Handlebars from "handlebars";
import { transporter } from "../../lib/nodemailer";
import {
  expiryFromNow,
  randomToken,
  sha256,
  VERIFY_TTL_MS,
} from "../../lib/token";
import { AppError } from "../../utils/app.error";
import { PasswordService } from "../password/password.service";
import prisma from "../prisma/prisma.service";
import { RegisterDTO } from "./dto/register.dto";

export class AuthService {
  private passwordService: PasswordService;

  constructor() {
    this.passwordService = new PasswordService();
  }

  customerRegister = async ({ email }: RegisterDTO) => {
    const normalizedEmail = email.trim().toLowerCase();
    if (!normalizedEmail) throw new AppError("Email is required!", 400);

    const existingCustomer = await prisma.customer.findUnique({
      where: { email: normalizedEmail },
    });

    if (existingCustomer?.isVerified) {
      throw new AppError("Email already registered & verified", 400);
    }

    const rawToken = randomToken();
    const tokenHash = sha256(rawToken);
    const expiresAt = expiryFromNow(VERIFY_TTL_MS);

    let createdNew = false;
    let customer: { id: string; email: string };

    if (existingCustomer) {
      customer = await prisma.customer.update({
        where: { email: normalizedEmail },
        data: {
          verifyToken: tokenHash,
          verifyTokenExpiresAt: expiresAt,
        },
        select: { id: true, email: true },
      });
    } else {
      createdNew = true;
      customer = await prisma.customer.create({
        data: {
          email: normalizedEmail,
          role: "CUSTOMER",
          isVerified: false,
          verifyToken: tokenHash,
          verifyTokenExpiresAt: expiresAt,
        },
        select: { id: true, email: true },
      });
    }

    try {
      const templateHtml = fs.readFileSync(
        "src/assets/customerRegister.html",
        "utf-8"
      );
      const compiledHtml = Handlebars.compile(templateHtml);
      const resultHtml = compiledHtml({
        linkUrl: `${process.env.VERIFY_URL_CUSTOMER!}/verify?token=${rawToken}&email=${encodeURIComponent(normalizedEmail)}`,
        email: customer?.email,
        expiresInMinutes: Math.floor(VERIFY_TTL_MS / 60000),
      });

      await transporter.sendMail({
        subject: "Verify your email & set password",
        to: customer.email,
        html: resultHtml,
      });

      return {
        message:
          "Create account successfully. Please verify your account! The link has been sent to your email",
      };
    } catch (error) {
      if (createdNew) {
        await prisma.customer.delete({ where: { email: normalizedEmail } });
      }
      throw new AppError("Failed to send email. Account creation aborted", 500);
    }
  };

  resendVerificationEmail = async ({ email }: RegisterDTO) => {
    const normalizedEmail = email.trim().toLowerCase();
    if (!normalizedEmail) throw new AppError("Email is required!", 400);

    const customer = await prisma.customer.findUnique({
      where: { email: normalizedEmail },
    });
    if (!customer) throw new AppError("Email is not found!", 400);
    if (customer.isVerified) throw new AppError("Already verified!", 400);

    const rawToken = randomToken();
    const tokenHash = sha256(rawToken);
    const expiresAt = expiryFromNow(VERIFY_TTL_MS);

    const prev = {
      verifyToken: customer.verifyToken,
      verifyTokenExpiresAt: customer.verifyTokenExpiresAt,
    };

    try {
      await prisma.customer.update({
        where: { email: normalizedEmail },
        data: {
          verifyToken: tokenHash,
          verifyTokenExpiresAt: expiresAt,
        },
      });

      const templateHtml = fs.readFileSync(
        "src/assets/customerRegister.html",
        "utf-8"
      );
      const compiledHtml = Handlebars.compile(templateHtml);
      const resultHtml = compiledHtml({
        linkUrl: `${process.env.VERIFY_URL_CUSTOMER!}/verify?token=${rawToken}&email=${encodeURIComponent(normalizedEmail)}`,
        email: customer?.email,
        expiresInMinutes: Math.floor(VERIFY_TTL_MS / 60000),
      });

      await transporter.sendMail({
        subject: "Verify your email & set password",
        to: customer.email,
        html: resultHtml,
      });

      return {
        message:
          "Verification email resent. Please verify your account! The link has been sent to your email",
      };
    } catch (error) {
      await prisma.customer
        .update({
          where: { email: normalizedEmail },
          data: {
            verifyToken: prev.verifyToken,
            verifyTokenExpiresAt: prev.verifyTokenExpiresAt,
          },
        })
        .catch(() => {});
      throw new AppError("Resend email failed", 500);
    }
  };
}
