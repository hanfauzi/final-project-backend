import prisma from "../../prisma/prisma.service";
import { GetPerformanceDto } from "./dto/get-perfomance.dto";

export class PerformanceReportService {
  getPerformanceInfo = async (filter: GetPerformanceDto) => {
    const { startDate, endDate, outletId } = filter;

    const workerTasks = await prisma.workerTask.groupBy({
      by: ["employeeId", "outletId"],
      _count: { id: true },
      where: {
        status: "DONE",
        createdAt: { gte: new Date(startDate), lte: new Date(endDate) },
        ...(outletId && { outletId }),
      },
    });
    
    const workerIds = workerTasks
      .map((t) => t.employeeId)
      .filter((id): id is string => id !== null);
    const workers = await prisma.employee.findMany({
      where: { id: { in: workerIds } },
      select: { id: true, name: true, role: true },
    });

    const workerPerformance = workerTasks.map((task) => {
      const emp = workers.find((w) => w.id === task.employeeId);
      const target = 10; 
      return {
        employeeId: task.employeeId,
        employeeName: emp?.name,
        role: emp?.role,
        outletId: task.outletId,
        totalDone: task._count.id,
        target,
      };
    });

    const pickupTasks = await prisma.pickUpOrder.groupBy({
      by: ["driverId", "outletId"],
      _count: { id: true },
      where: {
        status: "RECEIVED_BY_OUTLET",
        pickedUpAt: { gte: new Date(startDate), lte: new Date(endDate) },
        ...(outletId && { outletId }),
      },
    });

    const deliveryTasks = await prisma.deliveryOrder.groupBy({
      by: ["driverId", "outletId"],
      _count: { id: true },
      where: {
        status: "COMPLETED",
        deliveredAt: { gte: new Date(startDate), lte: new Date(endDate) },
        ...(outletId && { outletId }),
      },
    });

    const driverIds = [
      ...pickupTasks.map((t) => t.driverId),
      ...deliveryTasks.map((t) => t.driverId),
    ].filter((id): id is string => id !== null);

    const drivers = await prisma.employee.findMany({
      where: { id: { in: driverIds } },
      select: { id: true, name: true, role: true },
    });

    const driverPerformanceMap: Record<string, any> = {};

    pickupTasks
      .filter((t): t is typeof t & { driverId: string } => t.driverId !== null)
      .forEach((task) => {
        const driverId = task.driverId;
        if (!driverPerformanceMap[driverId]) {
          driverPerformanceMap[driverId] = {
            employeeId: driverId,
            totalDone: 0,
            target: 10,
            outletId: task.outletId,
          };
        }
        driverPerformanceMap[driverId].totalDone += task._count.id;
      });

    deliveryTasks
      .filter((t): t is typeof t & { driverId: string } => t.driverId !== null)
      .forEach((task) => {
        if (!driverPerformanceMap[task.driverId]) {
          driverPerformanceMap[task.driverId] = {
            employeeId: task.driverId,
            totalDone: 0,
            target: 10,
            outletId: task.outletId,
          };
        }
        driverPerformanceMap[task.driverId].totalDone += task._count.id;
      });

    const driverPerformance = Object.values(driverPerformanceMap).map(
      (perf) => {
        const emp = drivers.find((w) => w.id === perf.employeeId);
        return {
          employeeId: perf.employeeId,
          employeeName: emp?.name,
          role: emp?.role,
          outletId: perf.outletId,
          totalDone: perf.totalDone,
          target: perf.target,
        };
      }
    );

    return {
      workers: workerPerformance,
      drivers: driverPerformance,
    };
  };
}
