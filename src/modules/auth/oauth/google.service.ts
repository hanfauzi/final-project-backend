import { OAuth2Client } from "google-auth-library";
import { OAuthProvider } from "../../../generated/prisma";
import { createToken } from "../../../lib/jwt";
import { AppError } from "../../../utils/app.error";
import prisma from "../../prisma/prisma.service";

export class GoogleService {
  private google = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

  googleSignIn = async (idToken: string) => {
    const ticket = await this.google.verifyIdToken({
      idToken,
      audience: process.env.GOOGLE_CLIENT_ID!,
    });

    const p = ticket.getPayload();
    if (!p) throw new AppError("Invalid Google token", 401);

    const { email, email_verified, name, picture } = p;
    if (!email) throw new AppError("Email tidak terdeteksi dari Google", 400);

    const customer = await prisma.customer.upsert({
      where: { email },
      update: {
        name: name ?? undefined,
        photoUrl: picture ?? undefined,
        isVerified: email_verified ? true : undefined,
        selectProvider: OAuthProvider.GOOGLE,
      },
      create: {
        email,
        name: name ?? null,
        photoUrl: picture ?? null,
        isVerified: !!email_verified,
        selectProvider: OAuthProvider.GOOGLE,
      },
      select: {
        id: true,
        email: true,
        role: true,
        name: true,
        photoUrl: true,
        phoneNumber: true,
      },
    });

    const token = createToken({
      payload: {
        id: customer.id,
        role: customer.role,
        email: customer.email,
        name: customer.name,
        phoneNumber: customer.phoneNumber,
      },
      secretKey: process.env.JWT_SECRET_KEY!,
      options: { expiresIn: "1h" },
    });

    return {
      success: true,
      token,
      customer: {
        id: true,
        email: true,
        role: true,
        name: true,
        phoneNumber: true,
      },
    };
  };
}
