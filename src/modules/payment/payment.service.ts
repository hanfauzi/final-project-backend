import prisma from "../prisma/prisma.service";
import { AppError } from "../../utils/app.error";
import { makeSnap, SnapPayload } from "../../lib/midtrans";

export class PaymentService {
createOrReusePayment = async (orderHeaderId: string) => {
  const order = await prisma.orderHeader.findUnique({
    where: { id: orderHeaderId },
    select: {
      id: true,
      invoiceNo: true,
      status: true,
      customers: { select: { name: true, email: true, phoneNumber: true } },
      OrderItem: true,
      pickUpOrderId: true,
      pickUpOrder: { select: { id: true, price: true } },
      deliveryOrder: { select: { price: true } },
      Payment: {
        where: { status: "WAITING", snapToken: { not: null } },
        take: 1,
      },
    },
  });

  if (!order) throw new AppError("Order not found", 404);
  if (order.status !== "WAITING_FOR_PAYMENT") {
    throw new AppError("Order is not ready for payment", 400);
  }
  if (!order.invoiceNo) throw new AppError("Order has no invoice number", 400);

  if (order.Payment.length) return order.Payment[0];

  const totalItems = order.OrderItem.reduce((s, it) => s + it.subTotal, 0);

  let pickup = 0;
  if (order.pickUpOrderId) {
    const orderHeaders = await prisma.orderHeader.findMany({
      where: { pickUpOrderId: order.pickUpOrderId },
      orderBy: { createdAt: "asc" },
      select: { id: true },
    });
    if (orderHeaders.length && orderHeaders[0].id === order.id) {
      pickup = order.pickUpOrder?.price ?? 0;
    }
  }

  const delivery = order.deliveryOrder?.price ?? 0;

  const amount = totalItems + pickup + delivery;
  if (amount <= 0) throw new AppError("Invalid amount", 400);

  const payload: SnapPayload = {
    transaction_details: {
      order_id: order.invoiceNo,
      gross_amount: amount,
    },
    customer_details: {
      first_name: order.customers?.name ?? "Customer",
      email: order.customers?.email,
      phone: order.customers?.phoneNumber ?? undefined,
    },
  };

  return prisma.$transaction(async (tx) => {
    const payment = await tx.payment.create({
      data: {
        orderHeaderId,
        amount,
        status: "WAITING",
        provider: "MIDTRANS",
      },
    });

    const snap = makeSnap();
    const snapTx = await snap.createTransaction(payload);

    const updated = await tx.payment.update({
      where: { id: payment.id },
      data: { snapToken: snapTx.token, snapRedirectUrl: snapTx.redirect_url },
    });

    return updated;
  });
};


  getPayment = async (query: { id?: string; orderHeaderId?: string }) => {
    const { id, orderHeaderId } = query;

    const payment = await prisma.payment.findFirst({
      where: id ? { id } : { orderHeaderId },
      orderBy: { createdAt: "desc" },
      include: {
        orderHeader: {
          include: { customers: true, outlets: true },
        },
      },
    });

    if (!payment) throw new AppError("Payment not found", 404);
    return payment;
  };

  updatePaymentStatus = async (body: {
    order_id: string;
    transaction_status: string;
    fraud_status?: string;
    payment_type?: string;
    transaction_id?: string;
  }) => {
    const {
      order_id,
      transaction_status,
      fraud_status,
      payment_type,
      transaction_id,
    } = body;

    const existing = await prisma.payment.findFirst({
      where: { orderHeader: { invoiceNo: order_id } },
      include: { orderHeader: true },
    });
    if (!existing) throw new AppError("Payment invoice not found", 404);

    let newStatus: "PAID" | "WAITING" | "FAILED" | "EXPIRED" | "CANCELED";
    if (transaction_status === "settlement") newStatus = "PAID";
    else if (transaction_status === "capture" && fraud_status === "accept")
      newStatus = "PAID";
    else if (transaction_status === "pending") newStatus = "WAITING";
    else if (transaction_status === "expire") newStatus = "EXPIRED";
    else if (["deny", "cancel"].includes(transaction_status))
      newStatus = "FAILED";
    else newStatus = "FAILED";

    const method =
      payment_type === "qris"
        ? "QRIS"
        : payment_type === "credit_card"
          ? "CREDIT"
          : ["gopay", "shopeepay"].includes(payment_type ?? "")
            ? "E_WALLET"
            : ["bank_transfer", "echannel"].includes(payment_type ?? "")
              ? "BANK_TRANSFER"
              : null;

    await prisma.payment.update({
      where: { id: existing.id },
      data: {
        status: newStatus,
        method: method as any,
        providerRef: transaction_id ?? undefined,
        paidAt: newStatus === "PAID" ? new Date() : null,
      },
    });

     if (newStatus === "PAID") {
    await prisma.orderHeader.update({
      where: { id: existing.orderHeaderId },
      data: { status: "READY_FOR_DELIVERY" },
    });
    await prisma.deliveryOrder.updateMany({
      where: { orderHeaderId: existing.orderHeaderId },
      data: { status: "WAITING_FOR_DRIVER"},
    });
  } 

  return { message: "Payment updated", status: newStatus };
};
}