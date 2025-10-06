import prisma from "../../prisma/prisma.service";
import { AppError } from "../../../utils/app.error";
import { AttendanceStatus, Prisma } from "../../../generated/prisma";
import { GetAttendanceByEmployeeDTO } from "../dto/getAttendanceByEmployee";

function toLocalStart(dateStr: string) {
  const d = new Date(dateStr);
  d.setHours(0, 0, 0, 0);
  return d;
}

function toLocalEnd(dateStr: string) {
  const d = new Date(dateStr);
  d.setHours(23, 59, 59, 999);
  return d;
}

export class GetAttendanceByEmployeeService {
  getAttendanceByEmployee = async (
    authUser: { id: string; role: string },
    query: GetAttendanceByEmployeeDTO
  ) => {
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

        const start = new Date(year, month - 1, 1, 0, 0, 0, 0);

        const lastDay = new Date(year, month, 0).getDate();
        const end = new Date(year, month - 1, lastDay, 23, 59, 59, 999);

        whereClause.createdAt = { gte: start, lte: end };
      } else if (fromDate || toDate) {
        whereClause.createdAt = {};
        if (fromDate) {
          whereClause.createdAt.gte = toLocalStart(fromDate);
        }
        if (toDate) {
          whereClause.createdAt.lte = toLocalEnd(toDate);
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
      if (error instanceof AppError) throw error;
      throw new AppError("Failed to get attendance", 500);
    }
  };
}
