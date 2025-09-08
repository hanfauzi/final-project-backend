import { AppError } from "../../../utils/app.error";
import prisma from "../../prisma/prisma.service";

export class AssignmentService {
  assignEmployeeToOutlet = async (
    employeeId: string,
    outletId: string | null
  ) => {
    const employee = await prisma.employee.findFirst({
      where: {
        id: employeeId,
        role: { notIn: ["SUPER_ADMIN", "CUSTOMER"] },
        deletedAt: null,
      },
    });
    if (!employee) {
      throw new AppError(
        "Employee not found or cannot assign SUPER ADMIN",
        404
      );
    }

    if (outletId) {
      const outlet = await prisma.outlet.findUnique({
        where: { id: outletId },
      });
      if (!outlet) throw new AppError("Outlet not found", 404);
    }

    const updatedEmployee = await prisma.employee.update({
      where: { id: employeeId },
      data: { outletId },
      include: { outlets: true },
    });

    return updatedEmployee;
  };

  unassignEmployeeFromOutlet = async (
    employeeId: string,
    outletId?: string
  ) => {
    const employee = await prisma.employee.findFirst({
    where: {
      id: employeeId,
      role: { notIn: ["SUPER_ADMIN", "CUSTOMER"] },
      deletedAt: null,
    },
    include: { outlets: true },
  });

  if (!employee) {
    throw new AppError("Employee not found or cannot unassign SUPER ADMIN", 404);
  }

  if (!employee.outletId) {
    throw new AppError(`Employee ${employee.name} is not assigned to any outlet`, 400);
  }

  if (outletId && employee.outletId !== outletId) {
    throw new AppError(`Employee ${employee.name} is not assigned to this outlet`, 400);
  }

  return await prisma.employee.update({
    where: { id: employeeId },
    data: { outletId: null },
    include: { outlets: true },
  });
  };

  getAssignedEmployeesByOutlet = async (outletId: string) => {
    const outlet = await prisma.outlet.findUnique({
      where: { id: outletId, deletedAt: null },
      include: { Employee: true },
    });
    if (!outlet) {
      throw new AppError("Outlet not found", 404);
    }
    return outlet.Employee;
  };
}
