import { TaskStatus } from "../../../generated/prisma";
import prisma from "../../prisma/prisma.service";

export class BypassRequestService {
  getRequests = async (outletId: string) => {
    return prisma.workerTask.findMany({
      where: {
        outletId,
        bypassReq: true,
        isReqAprooved: null,
      },
      include: {
        employee: true,
        workStation: true,
        orderHeader: {
          include: {
            OrderItem: {
              include: {
                orderItemLaundry: {
                  include: { laundryItem: true },
                },
                service: true,
              },
            },
          },
        },
        orderItem: true,
      },
      orderBy: {
        createdAt: "asc",
      },
    });
  };

  reviewBypass = async ({
    adminId,
    taskId,
    approve,
    note,
  }: {
    adminId: string;
    taskId: string;
    approve: boolean;
    note?: string;
  }) => {
    const task = await prisma.workerTask.findUnique({
      where: { id: taskId },
    });

    if (!task) throw new Error("Task not found");
    if (!task.bypassReq) throw new Error("Task is not requesting bypass");
    if (task.isReqAprooved !== null) throw new Error("Task already reviewed");

    return prisma.workerTask.update({
      where: { id: taskId },
      data: {
        isReqAprooved: approve,
        itemPassedNote: note,
        assignedById: adminId,
      },
    });
  };
}
