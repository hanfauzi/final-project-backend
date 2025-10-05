import prisma from "../../prisma/prisma.service";
import { AppError } from "../../../utils/app.error";
import { ClockInAttendanceDTO } from "../dto/clockInAttendance.dto";
import { getDistanceFromLatLonInMeters } from "../../../utils/geoDistance.util";

export class ClockInAttendanceService {
  clockInAttendance = async (
    body: ClockInAttendanceDTO,
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
    if (existingAttendance) {
      throw new AppError(
        "You have already clocked in for this shift today",
        400
      );
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

    const now = new Date();
    const [shiftHour, shiftMinute, shiftSecond] = employee.shift.startTime
      .split(":")
      .map(Number);

    const todayShiftStartTime = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate(),
      shiftHour,
      shiftMinute,
      shiftSecond,
      0
    );

    let status: "PRESENT" | "LATE" = "PRESENT";
    let lateMinutes: number | null = null;

    if (now > todayShiftStartTime) {
      status = "LATE";
      lateMinutes = Math.floor(
        (now.getTime() - todayShiftStartTime.getTime()) / (1000 * 60)
      );
    }

    try {
      const newAttendance = await prisma.attendance.create({
        data: {
          employeeId: authUser.id,
          outletId: employee.outlet.id,
          shiftId: employee.shiftId,
          date: new Date(
            Date.UTC(
              now.getFullYear(),
              now.getMonth(),
              now.getDate(),
              0,
              0,
              0,
              0
            )
          ),
          clockInAt: now,
          status,
          notes: body.notes ?? undefined,
          lateMinutes,
        },
      });

      return {
        message: "Clock-in successful",
        data: newAttendance,
        geoDistanceMeter: roundedDistance,
      };
    } catch (error) {
      console.error("Error : ", error);
      throw new AppError("Failed to clock-in", 500);
    }
  };
}
