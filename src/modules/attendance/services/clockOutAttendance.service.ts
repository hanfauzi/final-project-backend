import prisma from "../../prisma/prisma.service";
import { AppError } from "../../../utils/app.error";
import { ClockOutAttendanceDTO } from "../dto/clockOutAttendance.dto";
import { getDistanceFromLatLonInMeters } from "../../../utils/geoDistance.util";

export class ClockOutAttendanceService {
  clockOutAttendance = async (
    body: ClockOutAttendanceDTO,
    authUser: { id: string; role: string }
  ) => {
    const employee = await prisma.employee.findUnique({
      where: { id: authUser.id },
      include: { shift: true, outlet: true },
    });
    if (!employee?.shift) {
      throw new AppError("You are not assigned to any shift", 400);
    }
    if (!employee?.outlet) {
      throw new AppError("You are not assigned to any outlet", 400);
    }

    const locationDistance = getDistanceFromLatLonInMeters(
      body.latitude,
      body.longitude,
      employee.outlet.latitude,
      employee.outlet.longitude
    );
    const roundedDistance = Math.round(locationDistance);

    const maxDistanceMeters = 50;
    if (locationDistance > maxDistanceMeters) {
      throw new AppError(
        `You are too far from the outlet radius. Distance = ${roundedDistance}m, allowed = ${maxDistanceMeters}m`,
        400
      );
    }

    const today = new Date();
    const startOfDay = new Date(today.setHours(0, 0, 0, 0));
    const endOfDay = new Date(today.setHours(23, 59, 59, 999));
    const existingAttendance = await prisma.attendance.findFirst({
      where: {
        employeeId: authUser.id,
        shiftId: employee.shiftId,
        date: {
          gte: startOfDay,
          lte: endOfDay,
        },
        deletedAt: null,
      },
    });
    if (!existingAttendance) {
      throw new AppError("You haven't clocked in for this shift today", 400);
    }
    if (existingAttendance.clockOutAt) {
      throw new AppError(
        "You have already clocked out for this shift today",
        400
      );
    }

    const now = new Date();
    const [endHour, endMinute, endSecond] = employee.shift.endTime
      .split(":")
      .map(Number);

    const todayShiftEndTime = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate(),
      endHour,
      endMinute,
      endSecond,
      0
    );

    let workMinutes: number | null = null;
    if (existingAttendance.clockInAt) {
      workMinutes = Math.floor(
        (now.getTime() - existingAttendance.clockInAt.getTime()) / (1000 * 60)
      );
    }

    let earlyLeaveMin: number | null = null;
    if (now < todayShiftEndTime) {
      earlyLeaveMin = Math.floor(
        (todayShiftEndTime.getTime() - now.getTime()) / (1000 * 60)
      );
    }

    try {
      const clockOutAttendance = await prisma.attendance.update({
        where: {
          id: existingAttendance.id,
        },
        data: {
          clockOutAt: new Date(),
          workMinutes,
          earlyLeaveMin,
          notes: body.notes ?? existingAttendance.notes,
        },
      });

      return {
        message: "Clock out successful",
        data: clockOutAttendance,
        geoDistanceMeter: roundedDistance,
      };
    } catch (error) {
      console.error("Error : ", error);
      throw new AppError("Failed to clock-out", 500);
    }
  };
}
