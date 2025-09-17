import prisma from "../../prisma/prisma.service";
import { AppError } from "../../../utils/app.error";

export class GetEmployeeService {
  getEmployee = async (authUser: { id: string; role: string }) => {
    const allowedRoles = ["SUPER_ADMIN", "OUTLET_ADMIN", "DRIVER", "WORKER"];
    if (!allowedRoles.includes(authUser.role)) {
      throw new AppError("You are not an employee", 400);
    }

    try {
      const employees = await prisma.employee.findUnique({
        where: { id: authUser.id },
        include: {
          shift: { select: { name: true, startTime: true, endTime: true } },
        },
        omit: { password: true, resetPasswordToken: true },
      });

      return {
        message: "Get employees success!",
        data: employees,
      };
    } catch (error) {
      console.error("Error : ", error);
      throw new AppError("Failed to get employees", 500);
    }
  };
}
