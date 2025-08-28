import fs from "fs";
import Handlebars from "handlebars";
import { transporter } from "../../lib/nodemailer";
import { expiryFromNow, randomToken, VERIFY_TTL_MS } from "../../lib/token";
import { AppError } from "../../utils/app.error";
import { PasswordService } from "../password/password.service";
import prisma from "../prisma/prisma.service";
import { RegisterDTO } from "./dto/register.dto";
import { createToken } from "../../lib/jwt";
import { LoginDTO } from "./dto/login.dto";

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

    const token = randomToken();
    const expiresAt = expiryFromNow(VERIFY_TTL_MS);

    let createdNew = false;
    let customer: { id: string; email: string };

    if (existingCustomer) {
      customer = await prisma.customer.update({
        where: { email: normalizedEmail },
        data: {
          verifyToken: token,
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
          verifyToken: token,
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
        linkUrl: `${process.env.VERIFY_URL_CUSTOMER!}/${token}`,
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
          "Create account successfully. Please verify your account and Set your password! The link has been sent to your email",
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

    const token = randomToken();
    const expiresAt = expiryFromNow(VERIFY_TTL_MS);

    const prev = {
      verifyToken: customer.verifyToken,
      verifyTokenExpiresAt: customer.verifyTokenExpiresAt,
    };

    try {
      await prisma.customer.update({
        where: { email: normalizedEmail },
        data: {
          verifyToken: token,
          verifyTokenExpiresAt: expiresAt,
        },
      });

      const templateHtml = fs.readFileSync(
        "src/assets/resendVerification.html",
        "utf-8"
      );
      const compiledHtml = Handlebars.compile(templateHtml);
      const resultHtml = compiledHtml({
        linkUrl: `${process.env.VERIFY_URL_CUSTOMER!}/${token}`,
        email: customer?.email,
        expiresInMinutes: Math.floor(VERIFY_TTL_MS / 60000),
      });

      await transporter.sendMail({
        subject: "Verify your email & set password",
        to: customer.email,
        html: resultHtml,
      });

      return {
        token: token,
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

  setCustomerPassword = async ({
    verifyToken,
    password,
  }: {
    verifyToken: string;
    password: string;
  }) => {
    if (!verifyToken) throw new AppError("Token is required", 400);
    if (!password) throw new AppError("Password is required", 400);

    const now = new Date();

    const customer = await prisma.customer.findFirst({
      where: {
        verifyToken,
        verifyTokenExpiresAt: { gt: now },
      },
      select: { id: true },
    });
    console.log(verifyToken);
    if (!customer) throw new AppError("Invalid or expired token", 400);

    const hashedPassword = await this.passwordService.hashPassword(password);

    await prisma.customer.update({
      where: { id: customer.id },
      data: {
        password: hashedPassword,
        isVerified: true,
        verifyToken: null,
        verifyTokenExpiresAt: null,
      },
    });

    return {
      message:
        "Set password successfully and your account has been verified. You can login now!",
    };
  };

  customerLogin = async ({ email, password }: LoginDTO) => {
    const normalizedEmail = email?.trim().toLowerCase();
    if (!normalizedEmail) throw new AppError("Email is required!", 400);
    if (!password) throw new AppError("Password is required!", 400);

    const customer = await prisma.customer.findUnique({
      where: { email: normalizedEmail },
    });
    if (!customer) throw new AppError("Account not registered!", 404);
    if (!customer.isVerified)
      throw new AppError("Please verify your email first.", 403);

    if (!customer.password) {
      const via = customer.selectProvider ?? "provider";
      throw new AppError(
        `This account was created with ${via}. Please login with ${via} or set a password first.`,
        400
      );
    }

    const comparedPassword = await this.passwordService.comparePassword(
      password,
      customer.password
    );
    if (!comparedPassword)
      throw new AppError("Invalid email or password.", 401);

    const payload = {
      sub: customer.id,
      role: customer.role,
      email: customer.email,
    };
    const token = createToken({
      payload,
      secretKey: process.env.JWT_SECRET_KEY!,
      options: { expiresIn: "1h" },
    });

    return { token, payload };
  };
}
