import { Request, Response } from "express";
import crypto from "crypto";
import { PaymentService } from "./payment.service";
import prisma from "../prisma/prisma.service"; 
export class PaymentController {
  private paymentService: PaymentService;

  constructor() {
    this.paymentService = new PaymentService();
  }

  createOrReusePayment = async (req: Request, res: Response) => {
    const customerId = res.locals?.payload?.id 
    const { orderHeaderId } = req.body

    if (customerId && orderHeaderId) {
      const owned = await prisma.orderHeader.findFirst({
        where: { id: orderHeaderId, customerId, deletedAt: null },
        select: { id: true },
      });
      if (!owned) {
        return res.status(403).json({ message: "Forbidden: not your order" });
      }
    }

    const result = await this.paymentService.createOrReusePayment(orderHeaderId);
    res.status(201).json(result);
  };


  getPayment = async (req: Request, res: Response) => {
    const { id, orderHeaderId } = req.query as { id?: string; orderHeaderId?: string };
    if (!id && !orderHeaderId) {
      return res.status(400).json({ message: "id or orderHeaderId is required" });
    }

    const result = await this.paymentService.getPayment({ id, orderHeaderId });
    res.status(200).json(result);
  };


  midtransWebhook = async (req: Request, res: Response) => {
    const body = req.body as {
      order_id: string;
      status_code: string;
      gross_amount: string;
      signature_key: string;
      transaction_status: string;
      fraud_status?: string;
      payment_type?: string;
      transaction_id?: string;
    };

    const serverKey = process.env.MIDTRANS_SERVER_KEY!;
    const expectedSig = crypto
      .createHash("sha512")
      .update(body.order_id + body.status_code + body.gross_amount + serverKey)
      .digest("hex");

    if (expectedSig !== body.signature_key) {
      return res.status(401).json({ message: "Invalid signature" });
    }

    const result = await this.paymentService.updatePaymentStatus({
      order_id: body.order_id,
      transaction_status: body.transaction_status,
      fraud_status: body.fraud_status,
      payment_type: body.payment_type,
      transaction_id: body.transaction_id,
    });

    res.status(200).json(result);
  };

 
  manualWebhook = async (req: Request, res: Response) => {
    const body = req.body as {
      order_id: string;
      transaction_status: string;
      fraud_status?: string;
      payment_type?: string;
      transaction_id?: string;
    };

    const result = await this.paymentService.updatePaymentStatus({
      order_id: body.order_id,
      transaction_status: body.transaction_status,
      fraud_status: body.fraud_status,
      payment_type: body.payment_type,
      transaction_id: body.transaction_id,
    });

    res.status(200).json(result);
  };
}
