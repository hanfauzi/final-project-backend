import { create } from "domain";
import { AppError } from "../../utils/app.error";
import { PasswordService } from "../password/password.service";
import prisma from "../prisma/prisma.service";
import { LoginDTO } from "./dto/login.dto";
import { createToken } from "../../lib/jwt";

export class AuthEmployeeService {
  private passwordService: PasswordService;
  constructor() {
    this.passwordService = new PasswordService();
  }
  employeeLogin = async ({ email, password }: LoginDTO) => {
    const normalizedEmail = email?.trim().toLowerCase();
    if (!normalizedEmail) throw new AppError("Email is required!", 400);
    if (!password) throw new AppError("Password is required!", 400);

    const employee = await prisma.employee.findUnique({
      where: {
        email: normalizedEmail,
        deletedAt: null,
      },
    });

    if (!employee) throw new AppError("Account has not been registered", 401);
    if (!employee.password) throw new AppError("Invalid credentials", 401);

    const comparedPassword = await this.passwordService.comparePassword(
      password,
      employee.password
    );
    if (!comparedPassword) throw new AppError("Invalid credentials", 401);

    const payload: any = {
      id: employee.id,
      role: employee.role,
      email: employee.email,
    };

    if (employee.role === "OUTLET_ADMIN") {
      payload.outletId = employee.outletId;
    }

    const token = createToken({
      payload,
      secretKey: process.env.JWT_SECRET_KEY!,
      options: { expiresIn: "9h" },
    });

    return { token, payload };
  };
}
