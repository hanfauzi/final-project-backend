import { PaymentStatus } from "../../../generated/prisma";
import prisma from "../../prisma/prisma.service";

export class SalesReportService {
  forSuperAdmin = async (query: {
    outletId?: string;
    startDate?: string;
    endDate?: string;
  }) => {
    const { outletId, startDate, endDate } = query;

    const filters: any = {
      status: PaymentStatus.PAID,
      paidAt: { not: null },
      ...(outletId && { orderHeader: { outletId } }),
      ...(startDate && { paidAt: { gte: new Date(startDate) } }),
      ...(endDate && { paidAt: { lte: new Date(endDate) } }),
    };

    const payments = await prisma.payment.findMany({
      where: filters,
      select: {
        amount: true,
        paidAt: true,
        orderHeader: {
            select: {outletId: true}
        }
      },
      orderBy: { paidAt: "asc" },
    });

    const grouped: Record<string, number> = {};

    payments.forEach((p) => {
      const date = p.paidAt!.toISOString().split("T")[0]; 
      grouped[date] = (grouped[date] || 0) + p.amount;
    });
    return Object.entries(grouped).map(([date, total]) => ({
      period: date,
      total,
    }));
  };

  forOutletAdmin = async (payload: {
    outletId: string;
    startDate?: string;
    endDate?: string;
  }) => {
    const { outletId, startDate, endDate } = payload;

    const filters: any = {
      status: PaymentStatus.PAID,
      paidAt: { not: null },
      orderHeader: { outletId },
      ...(startDate && { paidAt: { gte: new Date(startDate) } }),
      ...(endDate && { paidAt: { lte: new Date(endDate) } }),
    };

    const payments = await prisma.payment.findMany({
      where: filters,
      select: {
        amount: true,
        paidAt: true,
      },
      orderBy: { paidAt: "asc" },
    });

    return payments.map((p) => ({
      period: p.paidAt!.toISOString(),
      total: p.amount,
    }));
  };
}
