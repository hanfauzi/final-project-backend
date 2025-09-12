import { create } from "domain";
import { AppError } from "../../utils/app.error";
import { PasswordService } from "../password/password.service";
import prisma from "../prisma/prisma.service";
import { LoginDTO } from "./dto/login.dto";
import { createToken } from "../../lib/jwt";

export class AuthAdminService {
  private passwordService: PasswordService;
  constructor() {
    this.passwordService = new PasswordService();
  }
  superAdminLogin = async ({ email, password }: LoginDTO) => {
    const normalizedEmail = email?.trim().toLowerCase();
    if (!normalizedEmail) throw new AppError("Email is required!", 400);
    if (!password) throw new AppError("Password is required!", 400);

    const superAdmin = await prisma.employee.findUnique({
      where: {
        email: normalizedEmail,
        role: "SUPER_ADMIN",
        deletedAt: null,
      },
    });
    if (!superAdmin) throw new AppError("Account has not been registered", 401);

    if (!superAdmin.password) throw new AppError("Invalid credentials", 401);
    const superAdminComparedPassword =
      await this.passwordService.comparePassword(password, superAdmin.password);
    if (!superAdminComparedPassword)
      throw new AppError("Invalid credentials", 401);

    const payload = {
      id: superAdmin.id,
      role: superAdmin.role,
      email: superAdmin.email,
    };
    const token = createToken({
      payload,
      secretKey: process.env.JWT_SECRET_KEY!,
      options: { expiresIn: "9h" },
    });

    return { token, payload };
  };

  outletAdminLogin = async ({ email, password }: LoginDTO) => {
    const normalizedEmail = email?.trim().toLowerCase();
    if (!normalizedEmail) throw new AppError("Email is required!", 400);
    if (!password) throw new AppError("Password is required!", 400);

    const outletAdmin = await prisma.employee.findUnique({
      where: {
        email: normalizedEmail,
        role: "OUTLET_ADMIN",
        deletedAt: null,
      },
    });
    if (!outletAdmin)
      throw new AppError("Account has not been registered", 401);

    if (!outletAdmin.password) throw new AppError("Invalid credentials", 401);
    const outletAdminComparedPassword =
      await this.passwordService.comparePassword(
        password,
        outletAdmin.password
      );
    if (!outletAdminComparedPassword)
      throw new AppError("Invalid credentials", 401);

    const payload = {
      id: outletAdmin.id,
      role: outletAdmin.role,
      email: outletAdmin.email,
      outletId: outletAdmin.outletId,
    };
    const token = createToken({
      payload,
      secretKey: process.env.JWT_SECRET_KEY!,
      options: { expiresIn: "9h" },
    });
    return { token, payload };
  };
}
