// src/modules/google/google.service.ts
import { OAuth2Client } from "google-auth-library";
import prisma from "../../prisma/prisma.service";
import { AppError } from "../../../utils/app.error";
import { OAuthProvider } from "../../../generated/prisma";
import { createToken } from "../../../lib/jwt";
import { transporter } from "../../../lib/nodemailer";
import fs from "fs";
import Handlebars from "handlebars";
import { expiryFromNow, randomToken, VERIFY_TTL_MS } from "../../../lib/token";
import { RegisterDTO } from "../dto/register.dto";

export class GoogleService {
  private google = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

  googleLoginRegister = async (idToken: string) => {
    const ticket = await this.google.verifyIdToken({
      idToken,
      audience: process.env.GOOGLE_CLIENT_ID!,
    });
    const p = ticket.getPayload();
    if (!p) throw new AppError("Invalid Google Token!", 401);

    const { email, email_verified, name, picture } = p;
    if (!email) throw new AppError("Email is missing from Google profile", 400);

    const existed = await prisma.customer.findUnique({
      where: { email },
      select: { id: true, password: true },
    });

    const customer = await prisma.customer.upsert({
      where: { email },
      update: {
        name: name ?? undefined,
        photoUrl: picture ?? undefined,
        isVerified: email_verified ? true : undefined,
      },
      create: {
        email,
        name: name ?? null,
        photoUrl: picture ?? null,
        isVerified: !!email_verified,
        selectProvider: OAuthProvider.GOOGLE,
      },
    });

    const mode: "REGISTER" | "LOGIN" = existed ? "LOGIN" : "REGISTER";

    if (mode === "LOGIN") {
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

      return { success: true, mode, token, customer };
    }

    if (mode === "REGISTER") {
      await this.sendSetPasswordEmail(customer.email);
    }

    return {
      success: true,
      mode,
      setPasswordEmailSent: mode === "REGISTER",
      message:
        "Create account succesfully. Please set your password! The link has been sent to your email!",
    };
  };

  sendSetPasswordEmail = async (email: string) => {
    const token = randomToken();
    const expiresAt = expiryFromNow(VERIFY_TTL_MS);

    await prisma.customer.update({
      where: { email },
      data: {
        verifyToken: token,
        verifyTokenExpiresAt: expiresAt,
      },
      select: { id: true },
    });

    const templateHtml = fs.readFileSync(
      "src/assets/googleRegister.html",
      "utf-8"
    );
    const compiledHtml = Handlebars.compile(templateHtml);
    const resultHtml = compiledHtml({
      linkUrl: `${process.env.VERIFY_URL_CUSTOMER!}/${token}`,
      email,
      expiresInMinutes: Math.floor(VERIFY_TTL_MS / 60000),
    });

    await transporter.sendMail({
      subject: "Set your password",
      to: email,
      html: resultHtml,
    });
  };

   resendSetPasswordEmail = async ({ email }: RegisterDTO) => {
    const normalizedEmail = email.trim().toLowerCase();
    if (!normalizedEmail) throw new AppError("Email is required!", 400);

    const customer = await prisma.customer.findUnique({
      where: { email: normalizedEmail },
    });
    if (!customer) throw new AppError("Email is not found!", 400);
    if (customer.password != null) throw new AppError("Password has been set!", 400);

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
        "src/assets/resendSetPassword.html",
        "utf-8"
      );
      const compiledHtml = Handlebars.compile(templateHtml);
      const resultHtml = compiledHtml({
        linkUrl: `${process.env.VERIFY_URL_CUSTOMER!}/${token}`,
        email: customer?.email,
        expiresInMinutes: Math.floor(VERIFY_TTL_MS / 60000),
      });

      await transporter.sendMail({
        subject: "Set your password",
        to: customer.email,
        html: resultHtml,
      });

      return {
        token: token,
        message:
          "Set Password email resent. Please set your password! The link has been sent to your email",
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
