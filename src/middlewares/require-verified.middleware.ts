// middlewares/require-verified.middleware.ts
import { NextFunction, Request, Response } from "express";
import { AppError } from "../utils/app.error";
import prisma from "../modules/prisma/prisma.service";

export async function requireVerifiedCustomer(
  req: Request,
  res: Response,
  next: NextFunction
) {
  const customerId = res.locals?.payload?.id as string | undefined;
  if (!customerId) return next(new AppError("Unauthorized", 401));

  const customer = await prisma.customer.findUnique({
    where: { id: customerId },
    select: { isVerified: true },
  });

  if (!customer?.isVerified) {
    return next(
      new AppError("Please verify your email to place an order", 403)
    );
  }
  next();
}
