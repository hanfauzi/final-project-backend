import { Router } from "express";
import { OrderService } from "../order/order.service";

const router = Router();
const svc = new OrderService();

router.get("/auto-confirm", async (req, res) => {
  const auth = req.get("authorization") || "";
  const expected = `Bearer ${process.env.CRON_SECRET}`;
  if (!process.env.CRON_SECRET || auth !== expected) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  const result = await svc.autoConfirmDueOrders();
  return res.json(result);
});

export default router;
