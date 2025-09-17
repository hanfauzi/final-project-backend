import prisma from "../../prisma/prisma.service";
import { AppError } from "../../../utils/app.error";
import { GetAttendanceByAdminDTO } from "../dto/getAttendanceByAdmin.dto";
import { AttendanceStatus, Prisma } from "../../../generated/prisma";

export class GetAttendanceByAdminService {
  getAttendanceByAdmin = async (
    authUser: { id: string; role: string },
    query: GetAttendanceByAdminDTO
  ) => {
    const allowedRoles = ["SUPER_ADMIN", "OUTLET_ADMIN"];
    if (!allowedRoles.includes(authUser.role)) {
      throw new AppError("You are not an admin!", 400);
    }

    const { take, page, sortBy, sortOrder, search, attendanceStatus, fromDate, toDate, yearMonth } = query;
    const whereClause: Prisma.AttendanceWhereInput = {};

    if (search) {
      whereClause.OR = [
        { employees: { name: { contains: search, mode: "insensitive" } } },
        { employees: { email: { contains: search, mode: "insensitive" } } },
      ];
    }

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
        orderBy: { [sortBy]: sortOrder },
        skip: (page - 1) * take,
        take: take,
        include: {
          employees: {
            select: {
              name: true,
              email: true,
            },
          },
        },
      });

      const total = await prisma.attendance.count({
        where: whereClause,
      });

      return {
        message: "Get attendance by admin success!",
        data: attendance,
        meta: { page, take, total },
      };
    } catch (error) {
      console.error("Error : ", error);
      throw new AppError("Failed to get attendance", 500);
    }
  };
}
