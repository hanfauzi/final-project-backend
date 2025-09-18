import { Prisma } from "../../../generated/prisma";
import { AppError } from "../../../utils/app.error";
import { getMeta, getPagination } from "../../../utils/pagination.helper";
import { PasswordService } from "../../password/password.service";
import prisma from "../../prisma/prisma.service";
import { CreateEmployeeDTO } from "./dto/create.employee.dto";
import { UpdateEmployeeDTO } from "./dto/update.employee.dto";
import { Role } from "../../../generated/prisma";

export class EmployeeService {
  private passwordService: PasswordService;

  constructor() {
    this.passwordService = new PasswordService();
  }
  getAllEmployees = async (query: { page: number; limit: number; sortBy?: string; sortOrder?: "asc" | "desc"; search?: string }) => {
    const { page, limit, sortBy = "createdAt", sortOrder = "desc", search } = query;
  const { skip, take } = getPagination(page, limit);

  
const whereCondition: Prisma.EmployeeWhereInput = {
      NOT: { role: Role.CUSTOMER },
      deletedAt: null,
      ...(search
        ? {
            OR: [
              { name: { contains: search, mode: "insensitive" } },
              { email: { contains: search, mode: "insensitive" } },
            ],
          }
        : {}),
    };
    
    const [employees, total] = await prisma.$transaction([
    prisma.employee.findMany({
      where: whereCondition,
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        outletId: true,
        shiftId: true,
        phoneNumber: true,
        address: true,
        photoUrl: true,
        createdAt: true,
      },
      skip,
      take,
      orderBy: {
        [sortBy]: sortOrder,
      },
    }),
    prisma.employee.count({
      where: whereCondition,
    }),
  ]);

  return {
    data: employees,
    meta: getMeta(total, page, limit),
  };
  };

  getEmployeeDetailById = async (employeeId: string) => {
    const employee = await prisma.employee.findFirst({
      where: { id: employeeId, NOT: { role: "CUSTOMER" }, deletedAt: null },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        phoneNumber: true,
        address: true,
        photoUrl: true,
        outlet: { select: { id: true, name: true } },
        shift: true,
      },
    });
    if (!employee) {
      throw new AppError("Employee not found", 404);
    }
    return employee;
  };

  createEmployeeBySuperAdmin = async (body: CreateEmployeeDTO) => {
    const existingEmployee = await prisma.employee.findUnique({
      where: { email: body.email },
    });

    if (existingEmployee) {
      throw new AppError("Employee email already exists", 400);
    }

    if (body.role !== "SUPER_ADMIN") {
      const outlet = await prisma.outlet.findUnique({
        where: { id: body.outletId },
      });
      if (!outlet) {
        throw new AppError("Invalid outletId. Outlet not found.", 400);
      }
    }

    const shift = await prisma.shift.findUnique({
      where: { id: body.shiftId },
    });
    if (!shift) {
      throw new AppError("Invalid shiftId. Shift not found.", 400);
    }

    let hashedPassword: string | undefined;
    if (body.password) {
      hashedPassword = await this.passwordService.hashPassword(body.password);
    }

    const employee = await prisma.employee.create({
      data: {
        outletId: body.role === "SUPER_ADMIN" ? null : body.outletId ,
        shiftId: body.shiftId,
        role: body.role,
        name: body.name,
        email: body.email,
        password: hashedPassword,
        phoneNumber: body.phoneNumber,
        address: body.address,
        photoUrl: body.photoUrl,
      },
    });

    const { password, ...result } = employee;
    return result;
  };

  updateEmployeeBySuperAdmin = async (
    employeeId: string,
    body: UpdateEmployeeDTO
  ) => {
    try {
      if (body.email) {
        const existing = await prisma.employee.findUnique({
          where: { email: body.email },
        });
        if (existing && existing.id !== employeeId) {
          throw new AppError("Email already exists", 400);
        }
      }

      if (body.shiftId) {
        const shift = await prisma.shift.findUnique({
          where: { id: body.shiftId },
        });
        if (!shift) {
          throw new AppError("Invalid shiftId. Shift not found.", 400);
        }
      }

      const updatedEmployee = await prisma.employee.update({
        where: { id: employeeId },
        data: {
          ...(body.shiftId && { shiftId: body.shiftId }),
          ...(body.role && { role: body.role as any }),
          ...(body.name && { name: body.name }),
          ...(body.email && { email: body.email }),
          ...(body.password && {
            password: await this.passwordService.hashPassword(body.password),
          }),
          ...(body.phoneNumber && { phoneNumber: body.phoneNumber }),
          ...(body.address && { address: body.address }),
          ...(body.photoUrl && { photoUrl: body.photoUrl }),
        },
      });

      const { password, ...result } = updatedEmployee;
      return result;
    } catch (error: any) {
      if (error.code === "P2025") {
        throw new AppError("Employee not found", 404);
      }
      throw new AppError(`Failed to update employee: ${error.message}`, 500);
    }
  };

  deleteEmployeeBySuperAdmin = async (employeeId: string) => {
    const deletedEmployee = await prisma.employee.update({
      where: { id: employeeId },
      data: { deletedAt: new Date(), isActive: false },
    });
    const { password, ...result } = deletedEmployee;
    return result;
  };
}
