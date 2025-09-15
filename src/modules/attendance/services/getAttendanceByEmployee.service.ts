import prisma from "../../prisma/prisma.service";
import { AppError } from "../../../utils/app.error";
import { AttendanceStatus, Prisma } from "../../../generated/prisma";
import { GetAttendanceByEmployeeDTO } from "../dto/getAttendanceByEmployee";

export class GetAttendanceByEmployeeService {
  getAttendanceByEmployee = async (
    authUser: { id: string; role: string },
    query: GetAttendanceByEmployeeDTO
  ) => {
    const allowedRoles = ["SUPER_ADMIN", "OUTLET_ADMIN", "DRIVER", "WORKER"];
    if (!allowedRoles.includes(authUser.role)) {
      throw new AppError("You are not an employee", 400);
    }

    const { take, page, sortBy, sortOrder, attendanceStatus, fromDate, toDate, yearMonth } = query;
    const whereClause: Prisma.AttendanceWhereInput = { employeeId: authUser.id, };

    if (attendanceStatus) {
      const statusOptions = Object.values(AttendanceStatus);
      const matchedStatuses = statusOptions.filter((status) =>
        status.toLowerCase().includes(attendanceStatus.toLowerCase())
      );
      whereClause.OR = [
        ...matchedStatuses.map((status) => ({ status })),
      ];
    }
    
    if (yearMonth) {
      const [year, month] = yearMonth.split("-").map(Number);
      const start = new Date(Date.UTC(year, month - 1, 1, 0, 0, 0, 0));
      const end = new Date(Date.UTC(year, month, 0, 23, 59, 59, 999));

      whereClause.date = { gte: start, lte: end };
    } else if (fromDate || toDate) {
      whereClause.date = {};
      if (fromDate) {
        whereClause.date.gte = new Date(fromDate);
      }
      if (toDate) {
        const end = new Date(toDate);
        end.setUTCHours(23, 59, 59, 999);
        whereClause.date.lte = end;
      }
    }

    try {
      const attendance = await prisma.attendance.findMany({
        where: whereClause,
        orderBy: { [sortBy]: sortOrder},
        skip: (page - 1) * take,
        take: take,
        include: {
          employees: {
            select: {
              name: true,
              email: true,
            },
          },
        }
      });

      const total = await prisma.attendance.count({
        where: whereClause,
      });

      return {
        message: "Get attendance by employee success!",
        data: attendance,
        meta: { page, take, total },
      };
    } catch (error) {
      console.error("Error : ", error);
      throw new AppError("Failed to get attendance", 500);
    }
  };
}
