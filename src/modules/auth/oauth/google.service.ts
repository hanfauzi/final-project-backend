import { OAuth2Client } from "google-auth-library";
import { OAuthProvider } from "../../../generated/prisma";
import { createToken } from "../../../lib/jwt";
import { AppError } from "../../../utils/app.error";
import prisma from "../../prisma/prisma.service";

export class GoogleService {
  private google: OAuth2Client;

  constructor() {
    this.google = new OAuth2Client();
  }

  googleLoginRegister = async (idToken: string) => {
    const ticket = await this.google.verifyIdToken({
      idToken,
      audience: process.env.GOOGLE_CLIENT_ID!,
    });
    const p = ticket.getPayload();
    if (!p) throw new AppError("Invalid Google Token!", 401);

    const { email, email_verified, name, picture } = p;

    if (!email) throw new AppError("Email is missing from Google profile", 400);

    const customer = await prisma.customer.upsert({
      where: { email },
      update: {
        name: name ?? undefined,
        photoUrl: picture ?? undefined,
        isVerified: email_verified ? true : undefined,
        updatedAt: new Date(),
      },

      create: {
        email,
        name: name ?? null,
        photoUrl: picture ?? null,
        isVerified: !!email_verified,
        selectProvider: OAuthProvider.GOOGLE,
      },
    });

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

    return { token, customer };
  };
}
