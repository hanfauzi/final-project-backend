import cron from "node-cron";
import { OrderService } from "../modules/order/order.service";

const svc = new OrderService();

const startAutoConfirmOrdersJob = () => {
  console.log("[CRON] Job autoConfirmOrders dijadwalkan setiap 15 menit (Asia/Jakarta).");

  cron.schedule("*/15 * * * *", async () => {
    try {
      const { count } = await svc.autoConfirmDueOrders();
      if (count > 0) {
        console.log(`[CRON ✅] Auto-confirmed ${count} orders`);
      } else {
        console.log("[CRON] Tidak ada order yang perlu auto-confirm");
      }
    } catch (err) {
      console.error("[CRON ❌] Gagal auto-confirm orders:", err);
    }
  }, {
    timezone: "Asia/Jakarta",
  });
};

export default startAutoConfirmOrdersJob;
